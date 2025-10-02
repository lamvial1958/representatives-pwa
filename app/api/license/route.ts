import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DB_ENABLED } from "@/lib/config"
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

export async function GET(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({
        success: true,
        data: {
          hasLicense: false,
          type: 'trial',
          status: 'active',
          daysRemaining: 30,
          features: ['basic']
        }
      })
    }

    const license = await prisma.license.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    })

    if (!license) {
      return NextResponse.json({
        success: true,
        data: {
          hasLicense: false,
          type: 'trial',
          status: 'expired',
          daysRemaining: 0,
          features: []
        }
      })
    }

    const isValid = isLicenseValid(license)
    const daysRemaining = license.expiryDate 
      ? Math.max(0, Math.ceil((new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 365

    // Atualizar último check
    await prisma.license.update({
      where: { id: license.id },
      data: { lastCheck: new Date() }
    })

    return NextResponse.json({
      success: true,
      data: {
        hasLicense: true,
        key: license.key,
        type: license.type,
        status: isValid ? license.status : 'expired',
        expiryDate: license.expiryDate,
        daysRemaining,
        maxUsers: license.maxUsers,
        issuedTo: license.issuedTo,
        features: license.features ? JSON.parse(license.features) : [],
        isValid
      }
    })

  } catch (error: any) {
    console.error('GET /api/license error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
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
        key: generateLicenseKey(),
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
      where: { key: body.key }
    })

    if (!license) {
      return NextResponse.json({ success: false, error: "License not found" }, { status: 404 })
    }

    const updated = await prisma.license.update({
      where: { key: body.key },
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
