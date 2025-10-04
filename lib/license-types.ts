// ============================================================================
// LICENSE SYSTEM - Shared TypeScript Types
// ============================================================================
// Shared between server (APIs) and client (UI, LicenseManager)

// License Types
export type LicenseType = 'trial' | 'standard' | 'premium' | 'enterprise'

// License Status
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended'

// Device Status
export type DeviceStatus = 'active' | 'blocked'

// Backup Reason
export type BackupReason = 'manual' | 'auto' | 'before_update' | 'recovery'

// ============================================================================
// MAIN LICENSE VIEW - Returned by APIs
// ============================================================================

export interface LicenseView {
  // Basic Info
  hasLicense: boolean
  key: string                    // licenseKey from database
  type: LicenseType
  status: LicenseStatus
  
  // Device Info
  deviceId: string
  
  // Ownership
  issuedTo: string
  companyName?: string
  
  // Expiry
  expiryDate: string | null      // ISO format, null = lifetime
  isLifetime: boolean            // Derived: expiryDate === null
  daysRemaining: number          // Derived: days until expiry, -1 if lifetime
  
  // Limits
  maxUsers: number
  features: string[]             // Parsed from JSON string in DB
  
  // Policy (from env vars)
  policy: {
    fingerprintTolerance: number
    graceDays: number
    allowTrial: boolean
    trialDays: number
  }
  
  // Timestamps
  lastValidatedAt: string        // ISO format
}

// ============================================================================
// API INPUTS
// ============================================================================

// POST /api/license/activate
export interface ActivateLicenseInput {
  licenseKey: string
  deviceId: string               // Generated client-side from hardware
  deviceInfo: DeviceInfo         // Full device information
}

export interface DeviceInfo {
  os: string                     // "Windows", "macOS", "Linux"
  browser: string                // "Chrome", "Firefox", "Safari"
  platform: string               // "Win32", "MacIntel"
  screen: string                 // "1920x1080"
  userAgent: string              // Full UA string
}

// PUT /api/license/heartbeat
export interface HeartbeatInput {
  deviceId: string
  fingerprint: string            // Current flexible fingerprint
  similarity: number             // 0-1, calculated client-side
  usageTick?: UsageTick
}

export interface UsageTick {
  type: 'open' | 'ping'
  timestamp: string              // ISO format
}

// DELETE /api/license/device
export interface DeleteDeviceInput {
  deviceId: string
}

// POST /api/license/backup
export interface CreateBackupInput {
  deviceId: string
  reason: BackupReason
}

// POST /api/license/restore
export interface RestoreBackupInput {
  backupId: string
}

// ============================================================================
// API OUTPUTS
// ============================================================================

// Backup metadata
export interface BackupMetadata {
  id: string
  createdAt: string              // ISO format
  reason: BackupReason
  preview?: {
    licenseKey?: string
    type?: LicenseType
    deviceId?: string
  }
}

// Policy response
export interface PolicyResponse {
  fingerprintTolerance: number
  graceDays: number
  allowTrial: boolean
  trialDays: number
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: string                  // User-friendly message
  code?: string                  // Machine-readable code
  details?: any                  // Additional context
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// INTERNAL TYPES (used by LicenseManager)
// ============================================================================

// Hardware-only fingerprint components (rigid)
export interface HardwareFingerprint {
  canvas: string                 // Canvas fingerprint hash
  screen: string                 // Screen resolution
  hardwareConcurrency: number    // CPU cores
  deviceMemory?: number          // RAM in GB
  timezone: string               // Timezone offset
  platform: string               // OS platform
}

// Flexible fingerprint components (can change)
export interface FlexibleFingerprint {
  browser: string
  browserVersion: string
  userAgent: string
  plugins: string[]
  fonts: string[]
  osVersion?: string
}

// Complete fingerprint data
export interface FingerprintData {
  deviceId: string               // Hash of HardwareFingerprint
  hardware: HardwareFingerprint
  flexible: FlexibleFingerprint
  fingerprintString: string      // Hash of FlexibleFingerprint
  timestamp: string              // ISO format
}

// ============================================================================
// DATABASE MODELS (for reference, actual models in Prisma schema)
// ============================================================================

// These match the Prisma schema but are TypeScript types
export interface LicenseModel {
  id: string
  licenseKey: string
  type: string
  status: string
  expiryDate: Date | null
  maxUsers: number
  features: string               // JSON string
  issuedTo: string | null
  companyName: string | null
  issuedAt: Date
  lastCheck: Date
  createdAt: Date
  updatedAt: Date
}

export interface LicenseDeviceModel {
  id: string
  licenseId: string
  deviceId: string
  deviceInfo: string             // JSON string
  fingerprintHistory: string     // JSON string (array)
  firstSeenAt: Date
  lastSeenAt: Date
  lastValidatedAt: Date
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface LicenseBackupModel {
  id: string
  licenseId: string | null
  deviceId: string | null
  snapshot: string               // JSON string
  reason: string
  createdAt: Date
}