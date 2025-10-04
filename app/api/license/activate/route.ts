import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ActivateLicenseInput, LicenseView, ApiResponse } from "@/lib/license-types"

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
    const body: ActivateLicenseInput = await req.json()

    // Validação de entrada
    if (!body.licenseKey || !body.deviceId || !body.deviceInfo) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: licenseKey, deviceId, deviceInfo',
        code: 'INVALID_INPUT'
      }, { status: 400 })
    }

    // Buscar licença
    const license = await prisma.license.findUnique({
      where: { licenseKey: body.licenseKey }
    })

    // Se não existe e trial permitido, criar trial automaticamente
    if (!license) {
      const allowTrial = process.env.LICENSE_ALLOW_TRIAL === 'true'
      
      if (!allowTrial) {
        return NextResponse.json({
          success: false,
          error: 'License key not found',
          code: 'LICENSE_NOT_FOUND'
        }, { status: 404 })
      }

      // Criar licença trial
      const trialDays = parseInt(process.env.LICENSE_TRIAL_DAYS || '30')
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + trialDays)

      const newLicense = await prisma.license.create({
        data: {
          licenseKey: body.licenseKey,
          type: 'trial',
          status: 'active',
          expiryDate,
          maxUsers: 1,
          features: JSON.stringify(['basic', 'clients', 'receivables']),
          issuedTo: 'Trial User'
        }
      })

      // Criar device
      const device = await prisma.licenseDevice.create({
        data: {
          licenseId: newLicense.id,
          deviceId: body.deviceId,
          deviceInfo: JSON.stringify(body.deviceInfo),
          fingerprintHistory: JSON.stringify([]),
          status: 'active'
        }
      })

      return NextResponse.json({
        success: true,
        data: buildLicenseView(device, newLicense)
      }, { status: 201 })
    }

    // Validar status da licença
    if (license.status === 'revoked' || license.status === 'suspended') {
      return NextResponse.json({
        success: false,
        error: `License is ${license.status}`,
        code: 'LICENSE_INVALID_STATUS'
      }, { status: 403 })
    }

    // Verificar se deviceId já está em uso por OUTRA licença
    const existingDevice = await prisma.licenseDevice.findUnique({
      where: { deviceId: body.deviceId },
      include: { license: true }
    })

    if (existingDevice && existingDevice.licenseId !== license.id) {
      return NextResponse.json({
        success: false,
        error: 'Device already registered to another license',
        code: 'DEVICE_ALREADY_REGISTERED',
        details: {
          existingLicenseKey: existingDevice.license.licenseKey
        }
      }, { status: 409 })
    }

    // Se device já existe para esta licença, retornar view
    if (existingDevice && existingDevice.licenseId === license.id) {
      // Atualizar timestamps
      const updated = await prisma.licenseDevice.update({
        where: { deviceId: body.deviceId },
        data: {
          lastSeenAt: new Date(),
          lastValidatedAt: new Date(),
          deviceInfo: JSON.stringify(body.deviceInfo)
        },
        include: { license: true }
      })

      await prisma.license.update({
        where: { id: license.id },
        data: { lastCheck: new Date() }
      })

      return NextResponse.json({
        success: true,
        data: buildLicenseView(updated, updated.license)
      })
    }

    // Criar novo device para esta licença
    const device = await prisma.licenseDevice.create({
      data: {
        licenseId: license.id,
        deviceId: body.deviceId,
        deviceInfo: JSON.stringify(body.deviceInfo),
        fingerprintHistory: JSON.stringify([]),
        status: 'active'
      }
    })

    // Atualizar lastCheck da licença
    await prisma.license.update({
      where: { id: license.id },
      data: { lastCheck: new Date() }
    })

    return NextResponse.json({
      success: true,
      data: buildLicenseView(device, license)
    }, { status: 201 })

  } catch (error: any) {
    console.error('POST /api/license/activate error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}