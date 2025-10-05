import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth/middleware'
import { LogoutResponse } from '@/lib/auth/types'

export async function POST(req: NextRequest): Promise<NextResponse<LogoutResponse>> {
  try {
    // Criar cookie de logout (expira imediatamente)
    const cookie = clearAuthCookie()

    console.log('Admin deslogado com sucesso')

    // Criar resposta
    const response = NextResponse.json({
      success: true as const,  // ✅ FIX
      message: 'Logout realizado com sucesso'
    }, { status: 200 })

    // Limpar cookie
    response.cookies.set(
      cookie.name,
      cookie.value,
      cookie.options
    )

    return response

  } catch (error: any) {
    console.error('Erro no logout admin:', error)
    return NextResponse.json({
      success: true as const,  // ✅ FIX
      message: 'Logout realizado' // Sempre retorna sucesso
    }, { status: 200 })
  }
}