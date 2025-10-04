import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { HeartbeatInput, LicenseView, ApiResponse } from "@/lib/license-types"

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

function addToFingerprintHistory(currentHistory: string, newFingerprint: string, maxEntries: number = 10): string {
  try {
    const history: string[] = JSON.parse(currentHistory)
    history.push(newFingerprint)
    
    // Manter apenas últimas N entradas
    if (history.length > maxEntries) {
      history.shift()
    }
    
    return JSON.stringify(history)
  } catch {
    return JSON.stringify([newFingerprint])
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse<LicenseView>>> {
  try {
    const body: HeartbeatInput = await req.json()

    // Validação de entrada
    if (!body.deviceId || !body.fingerprint || body.similarity === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: deviceId, fingerprint, similarity',
        code: 'INVALID_INPUT'
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

    const tolerance = parseFloat(process.env.LICENSE_FP_TOLERANCE || '0.90')
    const graceDays = parseInt(process.env.LICENSE_GRACE_DAYS || '3')
    
    // Verificar se similaridade está dentro da tolerância
    const isWithinTolerance = body.similarity >= tolerance

    let newStatus = device.status
    let updateData: any = {
      lastSeenAt: new Date(),
      lastValidatedAt: new Date()
    }

    // Se mudou significativamente, adicionar ao histórico
    if (body.similarity < 1.0) {
      updateData.fingerprintHistory = addToFingerprintHistory(
        device.fingerprintHistory,
        body.fingerprint
      )
    }

    // Se fora da tolerância, verificar grace period
    if (!isWithinTolerance) {
      const daysSinceFirstSeen = Math.ceil(
        (Date.now() - device.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Se passou do grace period, bloquear
      if (daysSinceFirstSeen > graceDays) {
        newStatus = 'blocked'
        updateData.status = 'blocked'
        
        console.warn(`Device ${body.deviceId} blocked: fingerprint similarity ${body.similarity.toFixed(2)} below tolerance ${tolerance}`)
      } else {
        console.warn(`Device ${body.deviceId} in grace period: ${daysSinceFirstSeen}/${graceDays} days, similarity ${body.similarity.toFixed(2)}`)
      }
    }

    // Verificar se licença expirou
    let licenseStatus = device.license.status
    if (device.license.expiryDate && new Date(device.license.expiryDate) < new Date()) {
      licenseStatus = 'expired'
      
      await prisma.license.update({
        where: { id: device.license.id },
        data: { status: 'expired', lastCheck: new Date() }
      })
    } else {
      await prisma.license.update({
        where: { id: device.license.id },
        data: { lastCheck: new Date() }
      })
    }

    // Atualizar device
    const updated = await prisma.licenseDevice.update({
      where: { deviceId: body.deviceId },
      data: updateData,
      include: { license: true }
    })

    // Se usageTick fornecido, logar (futuro: salvar em tabela de analytics)
    if (body.usageTick) {
      console.log(`Usage tick: ${body.usageTick.type} at ${body.usageTick.timestamp} for device ${body.deviceId}`)
    }

    return NextResponse.json({
      success: true,
      data: buildLicenseView(updated, updated.license)
    })

  } catch (error: any) {
    console.error('PUT /api/license/heartbeat error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}