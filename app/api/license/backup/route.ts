import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CreateBackupInput, ApiResponse } from "@/lib/license-types"

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ backupId: string }>>> {
  try {
    const body: CreateBackupInput = await req.json()

    if (!body.deviceId || !body.reason) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: deviceId, reason',
        code: 'INVALID_INPUT'
      }, { status: 400 })
    }

    // Validar reason
    const validReasons = ['manual', 'auto', 'before_update', 'recovery']
    if (!validReasons.includes(body.reason)) {
      return NextResponse.json({
        success: false,
        error: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
        code: 'INVALID_REASON'
      }, { status: 400 })
    }

    // Buscar device com licença
    const device = await prisma.licenseDevice.findUnique({
      where: { deviceId: body.deviceId },
      include: { license: true }
    })

    if (!device) {
      return NextResponse.json({
        success: false,
        error: 'Device not found',
        code: 'DEVICE_NOT_FOUND'
      }, { status: 404 })
    }

    // Criar snapshot completo
    const snapshot = {
      license: {
        id: device.license.id,
        licenseKey: device.license.licenseKey,
        type: device.license.type,
        status: device.license.status,
        expiryDate: device.license.expiryDate ? device.license.expiryDate.toISOString() : null,
        maxUsers: device.license.maxUsers,
        features: device.license.features,
        issuedTo: device.license.issuedTo,
        companyName: device.license.companyName,
        issuedAt: device.license.issuedAt.toISOString(),
        lastCheck: device.license.lastCheck.toISOString()
      },
      device: {
        id: device.id,
        deviceId: device.deviceId,
        deviceInfo: device.deviceInfo,
        fingerprintHistory: device.fingerprintHistory,
        firstSeenAt: device.firstSeenAt.toISOString(),
        lastSeenAt: device.lastSeenAt.toISOString(),
        lastValidatedAt: device.lastValidatedAt.toISOString(),
        status: device.status
      },
      timestamp: new Date().toISOString()
    }

    // Criar backup
    const backup = await prisma.licenseBackup.create({
      data: {
        licenseId: device.license.id,
        deviceId: device.deviceId,
        snapshot: JSON.stringify(snapshot),
        reason: body.reason
      }
    })

    console.log(`Backup created: ${backup.id} for device ${body.deviceId} (reason: ${body.reason})`)

    return NextResponse.json({
      success: true,
      data: {
        backupId: backup.id
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('POST /api/license/backup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}