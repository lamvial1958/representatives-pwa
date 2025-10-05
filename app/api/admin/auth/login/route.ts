import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createToken, createAuthCookie } from '@/lib/auth/middleware'
import { LoginRequest, LoginResponse, AuthError } from '@/lib/auth/types'

export async function POST(req: NextRequest): Promise<NextResponse<LoginResponse | AuthError>> {
  try {
    const body: LoginRequest = await req.json()

    // Validar entrada
    if (!body.password) {
      return NextResponse.json({
        success: false,
        error: 'Senha é obrigatória',
        code: 'INVALID_PASSWORD'
      }, { status: 400 })
    }

    // Verificar senha
    const isValid = verifyPassword(body.password)

    if (!isValid) {
      console.warn('Tentativa de login com senha incorreta')
      return NextResponse.json({
        success: false,
        error: 'Senha incorreta',
        code: 'INVALID_PASSWORD'
      }, { status: 401 })
    }

    // Criar token JWT
    const token = createToken()

    // Criar cookie
    const cookie = createAuthCookie(token)

    // Calcular expiração
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()

    console.log('Admin autenticado com sucesso')

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      expiresAt
    }, { status: 200 })

    // Adicionar cookie à resposta
    response.cookies.set(
      cookie.name,
      cookie.value,
      cookie.options
    )

    return response

  } catch (error: any) {
    console.error('Erro no login admin:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno no servidor',
      code: 'UNAUTHORIZED'
    }, { status: 500 })
  }
}