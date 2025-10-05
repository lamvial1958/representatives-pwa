import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, validateToken } from '@/lib/auth/middleware'
import { AuthCheckResponse } from '@/lib/auth/types'

export async function GET(req: NextRequest): Promise<NextResponse<AuthCheckResponse>> {
  try {
    // Extrair token do cookie ou header
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({
        authenticated: false
      }, { status: 200 })
    }

    // Validar token
    const payload = validateToken(token)

    if (!payload) {
      return NextResponse.json({
        authenticated: false
      }, { status: 200 })
    }

    // Token válido
    return NextResponse.json({
      authenticated: true,
      expiresAt: new Date(payload.expiresAt).toISOString()
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro ao verificar autenticação:', error)
    return NextResponse.json({
      authenticated: false
    }, { status: 200 })
  }
}