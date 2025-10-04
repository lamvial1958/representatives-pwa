import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DB_ENABLED } from "@/lib/config"
import { LicenseView, ApiResponse } from "@/lib/license-types"
import crypto from 'crypto'

interface LicenseData {
  type: 'trial' | 'standard' | 'premium' | 'enterprise'
  expiryDate?: string
  maxUsers?: number
  issuedTo?: string
  features?: string[]
}

// Gerar chave de licença
function generateLicenseKey(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g)!.join('-')
}

// Validar se licença está válida
function isLicenseValid(license: any): boolean {
  if (license.status !== 'active') return false
  if (license.expiryDate && new Date(license.expiryDate) < new Date()) return false
  return true
}

// Calcular dias restantes
function calculateDaysRemaining(expiryDate: Date | null): number {
  if (!expiryDate) return -1 // Lifetime
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

// Construir LicenseView a partir de Device + License
function buildLicenseView(device: any, license: any): LicenseView {
  const isLifetime = !license.expiryDate
  const daysRemaining = calculateDaysRemaining(license.expiryDate)
  
  return {
    hasLicense: true,
    key: license.licenseKey,
    type: license.type,
    status: isLicenseValid(license) ? license.status : 'expired',
    deviceId: device.deviceId,
    issuedTo: license.issuedTo || 'Unknown',
    companyName: license.companyName,
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

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<LicenseView>>> {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({
        success: true,
        data: {
          hasLicense: false,
          key: '',
          type: 'trial',
          status: 'active',
          deviceId: '',
          issuedTo: 'Demo',
          expiryDate: null,
          isLifetime: false,
          daysRemaining: 30,
          maxUsers: 1,
          features: ['basic'],
          policy: {
            fingerprintTolerance: 0.90,
            graceDays: 3,
            allowTrial: false,
            trialDays: 30
          },
          lastValidatedAt: new Date().toISOString()
        }
      })
    }

    // Buscar por deviceId se fornecido
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')

    if (deviceId) {
      // Buscar device específico com licença relacionada
      const device = await prisma.licenseDevice.findUnique({
        where: { deviceId },
        include: { license: true }
      })

      if (!device) {
        return NextResponse.json({
          success: false,
          error: 'Device not found',
          code: 'DEVICE_NOT_FOUND'
        }, { status: 404 })
      }

      // Atualizar último check
      await prisma.license.update({
        where: { id: device.license.id },
        data: { lastCheck: new Date() }
      })

      return NextResponse.json({
        success: true,
        data: buildLicenseView(device, device.license)
      })
    }

    // Fallback: buscar primeira licença ativa (comportamento antigo)
    const license = await prisma.license.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { devices: { where: { status: 'active' }, take: 1 } }
    })

    if (!license) {
      return NextResponse.json({
        success: false,
        error: 'No active license found',
        code: 'NO_LICENSE'
      }, { status: 404 })
    }

    // Se tem device associado, retornar view completo
    if (license.devices.length > 0) {
      await prisma.license.update({
        where: { id: license.id },
        data: { lastCheck: new Date() }
      })

      return NextResponse.json({
        success: true,
        data: buildLicenseView(license.devices[0], license)
      })
    }

    // Licença sem device (legado)
    return NextResponse.json({
      success: true,
      data: {
        hasLicense: true,
        key: license.licenseKey,
        type: license.type as any,
        status: isLicenseValid(license) ? (license.status as any) : 'expired',
        deviceId: '',
        issuedTo: license.issuedTo || 'Unknown',
        companyName: license.companyName || undefined,
        expiryDate: license.expiryDate ? license.expiryDate.toISOString() : null,
        isLifetime: !license.expiryDate,
        daysRemaining: calculateDaysRemaining(license.expiryDate),
        maxUsers: license.maxUsers,
        features: license.features ? JSON.parse(license.features) : [],
        policy: {
          fingerprintTolerance: parseFloat(process.env.LICENSE_FP_TOLERANCE || '0.90'),
          graceDays: parseInt(process.env.LICENSE_GRACE_DAYS || '3'),
          allowTrial: process.env.LICENSE_ALLOW_TRIAL === 'true',
          trialDays: parseInt(process.env.LICENSE_TRIAL_DAYS || '30')
        },
        lastValidatedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('GET /api/license error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "Database not enabled" }, { status: 501 })
    }

    const body: LicenseData = await req.json()
    
    if (!body.type) {
      return NextResponse.json({ success: false, error: "License type is required" }, { status: 400 })
    }

    // Definir features baseado no tipo
    const featureMap = {
      trial: ['basic', 'clients', 'receivables'],
      standard: ['basic', 'clients', 'receivables', 'goals', 'reports'],
      premium: ['basic', 'clients', 'receivables', 'goals', 'reports', 'analytics', 'export'],
      enterprise: ['all']
    }

    const features = body.features || featureMap[body.type] || ['basic']

    // Calcular data de expiração se não fornecida
    let expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
    if (!expiryDate) {
      expiryDate = new Date()
      if (body.type === 'trial') {
        expiryDate.setDate(expiryDate.getDate() + 30) // 30 dias trial
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1) // 1 ano
      }
    }

    const license = await prisma.license.create({
      data: {
        licenseKey: generateLicenseKey(),
        type: body.type,
        status: 'active',
        expiryDate,
        maxUsers: body.maxUsers || (body.type === 'enterprise' ? 999 : body.type === 'premium' ? 10 : body.type === 'standard' ? 5 : 1),
        features: JSON.stringify(features),
        issuedTo: body.issuedTo || 'Sistema Representantes'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...license,
        features: JSON.parse(license.features)
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('POST /api/license error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "Database not enabled" }, { status: 501 })
    }

    const body: { key: string; status?: string; expiryDate?: string } = await req.json()
    
    if (!body.key) {
      return NextResponse.json({ success: false, error: "License key is required" }, { status: 400 })
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey: body.key }
    })

    if (!license) {
      return NextResponse.json({ success: false, error: "License not found" }, { status: 404 })
    }

    const updated = await prisma.license.update({
      where: { licenseKey: body.key },
      data: {
        status: body.status || license.status,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : license.expiryDate
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        features: JSON.parse(updated.features)
      }
    })

  } catch (error: any) {
    console.error('PUT /api/license error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}