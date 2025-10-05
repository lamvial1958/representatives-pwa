import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { ApiResponse } from '@/lib/license-types'

// PUT /api/admin/licenses/[id] - Atualizar licença
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verificar autenticação
  const authResult = await requireAuth(request)
  if (authResult) {
    return authResult
  }

  try {
    const { id } = params
    const body = await request.json()

    // Verificar se licença existe
    const existingLicense = await prisma.license.findUnique({
      where: { id }
    })

    if (!existingLicense) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Preparar dados para atualização (apenas campos permitidos)
    const updateData: any = {}

    if (body.issuedTo !== undefined) {
      updateData.issuedTo = body.issuedTo || null
    }

    if (body.companyName !== undefined) {
      updateData.companyName = body.companyName || null
    }

    if (body.maxUsers !== undefined) {
      const maxUsers = parseInt(body.maxUsers)
      if (isNaN(maxUsers) || maxUsers < 1) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Número de usuários inválido',
          code: 'INVALID_MAX_USERS'
        }
        return NextResponse.json(response, { status: 400 })
      }
      updateData.maxUsers = maxUsers
    }

    if (body.expiryDate !== undefined) {
      if (body.expiryDate === null || body.expiryDate === 'lifetime') {
        updateData.expiryDate = null
      } else {
        const expiryDate = new Date(body.expiryDate)
        if (isNaN(expiryDate.getTime())) {
          const response: ApiResponse<never> = {
            success: false,
            error: 'Data de expiração inválida',
            code: 'INVALID_DATE'
          }
          return NextResponse.json(response, { status: 400 })
        }
        updateData.expiryDate = expiryDate
      }
    }

    if (body.features !== undefined) {
      let features: string[]
      if (body.features === 'all') {
        features = ['all']
      } else if (Array.isArray(body.features)) {
        features = body.features
      } else {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Features inválidas',
          code: 'INVALID_FEATURES'
        }
        return NextResponse.json(response, { status: 400 })
      }
      updateData.features = JSON.stringify(features)
    }

    if (body.status !== undefined) {
      if (!['active', 'expired', 'revoked', 'suspended'].includes(body.status)) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Status inválido',
          code: 'INVALID_STATUS'
        }
        return NextResponse.json(response, { status: 400 })
      }
      updateData.status = body.status
    }

    // Atualizar licença
    const updatedLicense = await prisma.license.update({
      where: { id },
      data: updateData
    })

    console.log('✅ Licença atualizada:', {
      id,
      key: updatedLicense.licenseKey,
      changes: Object.keys(updateData)
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
      updatedAt: string
    }> = {
      success: true,
      data: {
        id: updatedLicense.id,
        licenseKey: updatedLicense.licenseKey,
        type: updatedLicense.type,
        status: updatedLicense.status,
        issuedTo: updatedLicense.issuedTo,
        companyName: updatedLicense.companyName,
        expiryDate: updatedLicense.expiryDate?.toISOString() || null,
        maxUsers: updatedLicense.maxUsers,
        features: JSON.parse(updatedLicense.features),
        updatedAt: updatedLicense.updatedAt.toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao atualizar licença:', error)
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Erro ao atualizar licença',
      code: 'UPDATE_ERROR'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/admin/licenses/[id] - Revogar licença
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verificar autenticação
  const authResult = await requireAuth(request)
  if (authResult) {
    return authResult
  }

  try {
    const { id } = params

    // Verificar se licença existe
    const existingLicense = await prisma.license.findUnique({
      where: { id },
      include: {
        devices: true
      }
    })

    if (!existingLicense) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Verificar se já está revogada
    if (existingLicense.status === 'revoked') {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Licença já está revogada',
        code: 'ALREADY_REVOKED'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Revogar licença e bloquear todos os devices ativos
    await prisma.$transaction([
      // Atualizar status da licença
      prisma.license.update({
        where: { id },
        data: { status: 'revoked' }
      }),
      // Bloquear todos os devices ativos
      prisma.licenseDevice.updateMany({
        where: {
          licenseId: id,
          status: 'active'
        },
        data: { status: 'blocked' }
      })
    ])

    console.log('✅ Licença revogada:', {
      id,
      key: existingLicense.licenseKey,
      devicesBlocked: existingLicense.devices.filter(d => d.status === 'active').length
    })

    const response: ApiResponse<{
      id: string
      licenseKey: string
      status: string
      devicesBlocked: number
      revokedAt: string
    }> = {
      success: true,
      data: {
        id: existingLicense.id,
        licenseKey: existingLicense.licenseKey,
        status: 'revoked',
        devicesBlocked: existingLicense.devices.filter(d => d.status === 'active').length,
        revokedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao revogar licença:', error)
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Erro ao revogar licença',
      code: 'REVOKE_ERROR'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}