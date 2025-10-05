import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { ApiResponse, LicenseType, LicenseStatus } from '@/lib/license-types'

// GET /api/admin/licenses - Lista todas as licenças com filtros
export async function GET(request: NextRequest) {
  // Verificar autenticação
  const authResult = await requireAuth(request)
  if (authResult) {
    return authResult // Retorna erro se não autenticado
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as LicenseStatus | null
    const type = searchParams.get('type') as LicenseType | null
    const search = searchParams.get('search') // Busca por chave ou nome

    // Construir filtros
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { licenseKey: { contains: search, mode: 'insensitive' } },
        { issuedTo: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Buscar licenças com contagem de devices
    const licenses = await prisma.license.findMany({
      where,
      include: {
        devices: {
          select: {
            id: true,
            deviceId: true,
            status: true,
            firstSeenAt: true,
            lastSeenAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatar resposta
    const formatted = licenses.map(license => ({
      id: license.id,
      licenseKey: license.licenseKey,
      type: license.type,
      status: license.status,
      issuedTo: license.issuedTo || 'Não especificado',
      companyName: license.companyName,
      expiryDate: license.expiryDate?.toISOString() || null,
      isLifetime: !license.expiryDate,
      maxUsers: license.maxUsers,
      features: JSON.parse(license.features),
      createdAt: license.createdAt.toISOString(),
      activeDevices: license.devices.filter(d => d.status === 'active').length,
      totalDevices: license.devices.length,
      devices: license.devices.map(d => ({
        id: d.id,
        deviceId: d.deviceId.substring(0, 12),
        status: d.status,
        firstSeen: d.firstSeenAt.toISOString(),
        lastSeen: d.lastSeenAt.toISOString()
      }))
    }))

    const response: ApiResponse<typeof formatted> = {
      success: true,
      data: formatted
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao listar licenças:', error)
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Erro ao buscar licenças',
      code: 'FETCH_ERROR'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/admin/licenses - Criar nova licença
export async function POST(request: NextRequest) {
  // Verificar autenticação
  const authResult = await requireAuth(request)
  if (authResult) {
    return authResult
  }

  try {
    const body = await request.json()

    // Validar campos obrigatórios
    if (!body.type || !['trial', 'standard', 'premium', 'enterprise', 'gift'].includes(body.type)) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Tipo de licença inválido',
        code: 'INVALID_TYPE'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Gerar chave única
    const licenseKey = await generateUniqueLicenseKey(body.type)

    // Calcular expiryDate se não for vitalícia
    let expiryDate: Date | null = null
    if (body.expiryDate && body.expiryDate !== 'lifetime') {
      expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + parseInt(body.expiryDate))
    }

    // Definir features
    let features: string[]
    if (body.features === 'all' || body.type === 'enterprise' || body.type === 'gift') {
      features = ['all']
    } else if (Array.isArray(body.features)) {
      features = body.features
    } else {
      // Features padrão por tipo
      features = getDefaultFeatures(body.type)
    }

    // Criar licença
    const license = await prisma.license.create({
      data: {
        licenseKey,
        type: body.type,
        status: 'active',
        expiryDate,
        maxUsers: body.maxUsers || getDefaultMaxUsers(body.type),
        features: JSON.stringify(features),
        issuedTo: body.issuedTo || null,
        companyName: body.companyName || null
      }
    })

    console.log('✅ Licença criada:', {
      key: licenseKey,
      type: body.type,
      issuedTo: body.issuedTo
    })

    const response: ApiResponse<{
      id: string
      licenseKey: string
      type: string
      status: string
      issuedTo: string | null
      companyName: string | null
      expiryDate: string | null
      maxUsers: number
      features: string[]
      createdAt: string
    }> = {
      success: true,
      data: {
        id: license.id,
        licenseKey: license.licenseKey,
        type: license.type,
        status: license.status,
        issuedTo: license.issuedTo,
        companyName: license.companyName,
        expiryDate: license.expiryDate?.toISOString() || null,
        maxUsers: license.maxUsers,
        features: JSON.parse(license.features),
        createdAt: license.createdAt.toISOString()
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar licença:', error)
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Erro ao criar licença',
      code: 'CREATE_ERROR'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

// Funções auxiliares

async function generateUniqueLicenseKey(type: string): Promise<string> {
  const prefix = type === 'enterprise' ? 'ENTP' : 
                 type === 'premium' ? 'PREM' :
                 type === 'standard' ? 'STND' :
                 type === 'gift' ? 'GIFT' : 'TRIL'
  
  const year = new Date().getFullYear()
  
  // Tentar até 100 vezes gerar uma chave única
  for (let i = 0; i < 100; i++) {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    const numberPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    const key = `${prefix}-${year}-${randomPart}-${numberPart}`
    
    // Verificar se já existe
    const existing = await prisma.license.findUnique({
      where: { licenseKey: key }
    })
    
    if (!existing) {
      return key
    }
  }
  
  throw new Error('Não foi possível gerar chave única após 100 tentativas')
}

function getDefaultFeatures(type: string): string[] {
  switch (type) {
    case 'trial':
      return ['basic', 'clients', 'receivables']
    case 'standard':
      return ['basic', 'clients', 'receivables', 'goals', 'reports']
    case 'premium':
      return ['basic', 'clients', 'receivables', 'goals', 'reports', 'analytics']
    case 'enterprise':
    case 'gift':
      return ['all']
    default:
      return ['basic']
  }
}

function getDefaultMaxUsers(type: string): number {
  switch (type) {
    case 'trial':
    case 'gift':
      return 1
    case 'standard':
      return 5
    case 'premium':
      return 10
    case 'enterprise':
      return 999
    default:
      return 1
  }
}