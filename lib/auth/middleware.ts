import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { JWTPayload, AuthError } from './types'

const JWT_SECRET = process.env.JWT_SECRET!
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 horas

// ============================================================================
// CRIAR TOKEN JWT
// ============================================================================

export function createToken(): string {
  const now = Date.now()
  const payload: JWTPayload = {
    admin: true,
    issuedAt: now,
    expiresAt: now + TOKEN_EXPIRY
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

// ============================================================================
// VALIDAR TOKEN JWT
// ============================================================================

export function validateToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    // Verificar se token expirou
    if (decoded.expiresAt < Date.now()) {
      return null
    }

    return decoded
  } catch (error) {
    return null
  }
}

// ============================================================================
// EXTRAIR TOKEN DO REQUEST (Cookie ou Header)
// ============================================================================

export function getTokenFromRequest(req: NextRequest): string | null {
  // Tentar pegar do cookie primeiro
  const cookieToken = req.cookies.get('admin_token')?.value
  if (cookieToken) return cookieToken

  // Fallback: tentar pegar do header Authorization
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

// ============================================================================
// VERIFICAR AUTENTICAÇÃO (Middleware para APIs)
// ============================================================================

export function requireAuth(req: NextRequest): NextResponse<AuthError> | null {
  const token = getTokenFromRequest(req)

  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Autenticação necessária',
      code: 'NO_TOKEN'
    }, { status: 401 })
  }

  const payload = validateToken(token)

  if (!payload) {
    return NextResponse.json({
      success: false,
      error: 'Token inválido ou expirado',
      code: 'INVALID_TOKEN'
    }, { status: 401 })
  }

  // Token válido - retorna null (sem erro)
  return null
}

// ============================================================================
// VERIFICAR SENHA ADMIN
// ============================================================================

export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD não configurado no .env')
    return false
  }

  return password === adminPassword
}

// ============================================================================
// CRIAR RESPONSE COM COOKIE
// ============================================================================

export function createAuthCookie(token: string): {
  name: string
  value: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict'
    maxAge: number
    path: string
  }
} {
  return {
    name: 'admin_token',
    value: token,
    options: {
      httpOnly: true,  // Não acessível via JavaScript (mais seguro)
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY / 1000, // Em segundos
      path: '/'
    }
  }
}

// ============================================================================
// LIMPAR COOKIE (Logout)
// ============================================================================

export function clearAuthCookie(): {
  name: string
  value: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict'
    maxAge: number
    path: string
  }
} {
  return {
    name: 'admin_token',
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expira imediatamente
      path: '/'
    }
  }
}