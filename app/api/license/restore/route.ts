import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { RestoreBackupInput, LicenseView, ApiResponse } from "@/lib/license-types"

function calculateDaysRemaining(expiryDate: Date | null): number {
  if (!expiryDate) return -1
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

function buildLicenseView(device: any, license: any): LicenseView {
  const isLifetime = !license.expiryDate
  const daysRemaining = calculateDaysRemaining(license.expiryDate)
  
  return {
    hasLicense: true,
    key: license.licenseKey,
    type: license.type,
    status: license.status,
    deviceId: device.deviceId,
    issuedTo: license.issuedTo || 'Unknown',
    companyName: license.companyName || undefined,
    expiryDate: license.expiryDate ? license.expiryDate.toISOString() : null,
    isLifetime,
    daysRemaining,
    maxUsers: license.maxUsers,
    features: license.features ? JSON.parse(license.features) : [],
    policy: {
      fingerprintTolerance: parseFloat(process.env.LICENSE_FP_TOLERANCE || '0.90'),
      graceDays: parseInt(process.env.LICENSE_GRACE_DAYS || '3'),
      allowTrial: process.env.LICENSE_ALLOW_TRIAL === 'true',
      trialDays: parseInt(process.env.LICENSE_TRIAL_DAYS || '30')
    },
    lastValidatedAt: device.lastValidatedAt.toISOString()
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<LicenseView>>> {
  try {
    const body: RestoreBackupInput = await req.json()

    if (!body.backupId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: backupId',
        code: 'INVALID_INPUT'
      }, { status: 400 })
    }

    // Buscar backup
    const backup = await prisma.licenseBackup.findUnique({
      where: { id: body.backupId }
    })

    if (!backup) {
      return NextResponse.json({
        success: false,
        error: 'Backup not found',
        code: 'BACKUP_NOT_FOUND'
      }, { status: 404 })
    }

    // Parse snapshot
    let snapshot: any
    try {
      snapshot = JSON.parse(backup.snapshot)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup snapshot',
        code: 'INVALID_SNAPSHOT'
      }, { status: 400 })
    }

    // Verificar se license e device existem no snapshot
    if (!snapshot.license || !snapshot.device) {
      return NextResponse.json({
        success: false,
        error: 'Incomplete backup snapshot',
        code: 'INCOMPLETE_SNAPSHOT'
      }, { status: 400 })
    }

    // Criar backup "before_restore" do estado atual (auditoria)
    const currentDevice = await prisma.licenseDevice.findUnique({
      where: { deviceId: snapshot.device.deviceId },
      include: { license: true }
    })

    if (currentDevice) {
      const beforeRestoreSnapshot = {
        license: {
          id: currentDevice.license.id,
          licenseKey: currentDevice.license.licenseKey,
          type: currentDevice.license.type,
          status: currentDevice.license.status,
          expiryDate: currentDevice.license.expiryDate ? currentDevice.license.expiryDate.toISOString() : null,
          maxUsers: currentDevice.license.maxUsers,
          features: currentDevice.license.features,
          issuedTo: currentDevice.license.issuedTo,
          companyName: currentDevice.license.companyName
        },
        device: {
          id: currentDevice.id,
          deviceId: currentDevice.deviceId,
          deviceInfo: currentDevice.deviceInfo,
          fingerprintHistory: currentDevice.fingerprintHistory,
          status: currentDevice.status
        },
        timestamp: new Date().toISOString()
      }

      await prisma.licenseBackup.create({
        data: {
          licenseId: currentDevice.license.id,
          deviceId: currentDevice.deviceId,
          snapshot: JSON.stringify(beforeRestoreSnapshot),
          reason: 'before_restore'
        }
      })
    }

    // Restaurar License
    const restoredLicense = await prisma.license.update({
      where: { id: snapshot.license.id },
      data: {
        type: snapshot.license.type,
        status: snapshot.license.status,
        expiryDate: snapshot.license.expiryDate ? new Date(snapshot.license.expiryDate) : null,
        maxUsers: snapshot.license.maxUsers,
        features: snapshot.license.features,
        issuedTo: snapshot.license.issuedTo,
        companyName: snapshot.license.companyName,
        lastCheck: new Date()
      }
    })

    // Restaurar Device
    const restoredDevice = await prisma.licenseDevice.update({
      where: { id: snapshot.device.id },
      data: {
        deviceInfo: snapshot.device.deviceInfo,
        fingerprintHistory: snapshot.device.fingerprintHistory,
        status: snapshot.device.status,
        lastSeenAt: new Date(),
        lastValidatedAt: new Date()
      },
      include: { license: true }
    })

    console.log(`Restored backup ${body.backupId} for device ${restoredDevice.deviceId}`)

    return NextResponse.json({
      success: true,
      data: buildLicenseView(restoredDevice, restoredDevice.license)
    })

  } catch (error: any) {
    console.error('POST /api/license/restore error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}