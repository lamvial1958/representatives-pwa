// ============================================================================
// ADMIN AUTHENTICATION - Types
// ============================================================================

// Payload do JWT Token
export interface JWTPayload {
  admin: boolean
  issuedAt: number  // Timestamp
  expiresAt: number // Timestamp
}

// Dados do admin autenticado
export interface AdminUser {
  authenticated: boolean
  issuedAt: string  // ISO string
  expiresAt: string // ISO string
}

// Request de login
export interface LoginRequest {
  password: string
}

// Response de login (sucesso)
export interface LoginResponse {
  success: true
  message: string
  expiresAt: string
}

// Response de logout
export interface LogoutResponse {
  success: true
  message: string
}

// Response de verificação de autenticação
export interface AuthCheckResponse {
  authenticated: boolean
  expiresAt?: string
}

// Erro de autenticação
export interface AuthError {
  success: false
  error: string
  code: 'INVALID_PASSWORD' | 'NO_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'UNAUTHORIZED'
}