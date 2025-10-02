export interface LicenseData {
  hasLicense: boolean
  key?: string
  type: 'trial' | 'standard' | 'premium' | 'enterprise'
  status: 'active' | 'expired' | 'revoked' | 'suspended'
  expiryDate?: Date | null
  daysRemaining: number
  maxUsers: number
  issuedTo?: string
  features: string[]
  isValid: boolean
  isLifetime?: boolean
}

export class LicenseManager {
  private static instance: LicenseManager | null = null
  private cachedLicense: LicenseData | null = null
  private lastCheck = 0

  static getInstance(): LicenseManager {
    if (!this.instance) {
      this.instance = new LicenseManager()
    }
    return this.instance
  }

  private isValidLicenseKey(key: string): boolean {
    const validKeys = [
      'ENTP-2025-VIAL-0001',
      'ENTP-2025-GIFT-0002', 
      'ENTP-2025-GIFT-0003',
      'ENTP-2025-GIFT-0004'
    ]
    return validKeys.includes(key)
  }

  async validateOrCreateLicense(): Promise<{ isValid: boolean; license?: LicenseData }> {
    try {
      const response = await fetch('/api/license')
      const data = await response.json()
      
      if (data.success && data.data) {
        this.cachedLicense = data.data
        return { isValid: true, license: data.data }
      }

      const trialLicense: LicenseData = {
        hasLicense: true,
        type: 'trial',
        status: 'active',
        daysRemaining: 30,
        maxUsers: 1,
        features: ['basic', 'clients', 'receivables'],
        isValid: true
      }

      return { isValid: true, license: trialLicense }
    } catch (error) {
      console.error('Erro na validação de licença:', error)
      return { isValid: false }
    }
  }

  async activateLicense(key: string, issuedTo?: string): Promise<LicenseData | null> {
    try {
      if (!this.isValidLicenseKey(key)) {
        return null
      }

      const licenseData: LicenseData = {
        hasLicense: true,
        key: key,
        type: 'enterprise',
        status: 'active',
        expiryDate: null,
        daysRemaining: 36500,
        maxUsers: key === 'ENTP-2025-VIAL-0001' ? 999 : 1,
        issuedTo: issuedTo || (key === 'ENTP-2025-VIAL-0001' ? 'Franco (Proprietário)' : 'Doação Individual'),
        features: ['all'],
        isValid: true,
        isLifetime: true
      }

      this.cachedLicense = licenseData
      this.storeLicenseKey(key)
      
      return licenseData
    } catch (error) {
      console.error('Erro na ativação de licença:', error)
      return null
    }
  }

  private getStoredLicenseKey(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('representatives_license_key')
      }
    } catch (error) {
      console.log('Erro ao acessar localStorage')
    }
    return null
  }

  private storeLicenseKey(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('representatives_license_key', key)
      }
    } catch (error) {
      console.log('Erro ao armazenar no localStorage')
    }
  }

  async getLicense(): Promise<LicenseData | null> {
    const now = Date.now()
    
    if (this.cachedLicense && (now - this.lastCheck) < 5 * 60 * 1000) {
      return this.cachedLicense
    }
    
    const validation = await this.validateOrCreateLicense()
    this.lastCheck = now
    
    return validation.license || null
  }

  getLicenseInfo(): LicenseData | null {
    return this.cachedLicense
  }

  getDaysRemaining(): number {
    return this.cachedLicense?.daysRemaining || 0
  }

  isTestVersion(): boolean {
    return this.cachedLicense?.type === 'trial' || false
  }

  hasFeature(feature: string): boolean {
    if (!this.cachedLicense || !this.cachedLicense.isValid) return false
    return this.cachedLicense.features.includes(feature) || this.cachedLicense.features.includes('all')
  }

  activateDefinitiveLicense(): void {
    // Método para compatibilidade
  }

  static async saveLicense(license: any) {
    return Promise.resolve()
  }

  static async loadLicense() {
    return LicenseManager.getInstance().getLicense()
  }

  static async removeLicense() {
    return Promise.resolve()
  }
}

export function saveLicenseToDatabase(license: any) {
  return LicenseManager.saveLicense(license)
}

export function loadLicenseFromDatabase() {
  return LicenseManager.loadLicense()
}

export function removeLicenseFromDatabase() {
  return LicenseManager.removeLicense()
}
