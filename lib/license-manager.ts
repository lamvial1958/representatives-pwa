import { 
  LicenseView, 
  ActivateLicenseInput,
  HeartbeatInput,
  DeviceInfo,
  HardwareFingerprint,
  FlexibleFingerprint,
  FingerprintData,
  PolicyResponse
} from './license-types'

// ============================================================================
// LICENSE MANAGER - Server-First, Zero localStorage
// ============================================================================

export class LicenseManager {
  private static instance: LicenseManager | null = null
  private cache: LicenseView | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private deviceId: string | null = null
  private lastFingerprint: string | null = null
  private isInitialized = false

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): LicenseManager {
    if (!this.instance) {
      this.instance = new LicenseManager()
    }
    return this.instance
  }

  // ==========================================================================
  // POLICY - Read from environment variables
  // ==========================================================================

  private getLicensePolicy(): PolicyResponse {
    return {
      fingerprintTolerance: parseFloat(process.env.NEXT_PUBLIC_LICENSE_FP_TOLERANCE || '0.90'),
      graceDays: parseInt(process.env.NEXT_PUBLIC_LICENSE_GRACE_DAYS || '3'),
      allowTrial: process.env.NEXT_PUBLIC_LICENSE_ALLOW_TRIAL === 'true',
      trialDays: parseInt(process.env.NEXT_PUBLIC_LICENSE_TRIAL_DAYS || '30')
    }
  }

  // ==========================================================================
  // FINGERPRINT - Hardware Rigid (deviceId) + Flexible (validation)
  // ==========================================================================

  private async generateCanvasFingerprint(): Promise<string> {
    if (typeof window === 'undefined') return 'server-side'

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'no-canvas'

      canvas.width = 200
      canvas.height = 50

      // Draw text with various styles
      ctx.textBaseline = 'top'
      ctx.font = '14px "Arial"'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Canvas Fingerprint', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Canvas Fingerprint', 4, 17)

      const dataURL = canvas.toDataURL()
      return this.hashString(dataURL)
    } catch {
      return 'canvas-error'
    }
  }

  private getHardwareFingerprint(): HardwareFingerprint {
    if (typeof window === 'undefined') {
      return {
        canvas: 'server-side',
        screen: '0x0',
        hardwareConcurrency: 0,
        timezone: '0',
        platform: 'server'
      }
    }

    return {
      canvas: '', // Will be filled async
      screen: `${window.screen.width}x${window.screen.height}`,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      timezone: new Date().getTimezoneOffset().toString(),
      platform: navigator.platform
    }
  }

  private getFlexibleFingerprint(): FlexibleFingerprint {
    if (typeof window === 'undefined') {
      return {
        browser: 'server',
        browserVersion: '0',
        userAgent: 'server',
        plugins: [],
        fonts: []
      }
    }

    const userAgent = navigator.userAgent
    let browser = 'Unknown'
    let browserVersion = '0'

    // Detect browser
    if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome'
      const match = userAgent.match(/Chrome\/(\d+)/)
      browserVersion = match ? match[1] : '0'
    } else if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox'
      const match = userAgent.match(/Firefox\/(\d+)/)
      browserVersion = match ? match[1] : '0'
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari'
      const match = userAgent.match(/Version\/(\d+)/)
      browserVersion = match ? match[1] : '0'
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge'
      const match = userAgent.match(/Edge\/(\d+)/)
      browserVersion = match ? match[1] : '0'
    }

    // Get plugins (limited in modern browsers)
    const plugins: string[] = []
    if (navigator.plugins) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name)
      }
    }

    return {
      browser,
      browserVersion,
      userAgent,
      plugins,
      fonts: [] // Font detection is complex, skip for now
    }
  }

  private async generateDeviceId(): Promise<string> {
    const hardware = this.getHardwareFingerprint()
    hardware.canvas = await this.generateCanvasFingerprint()

    const components = [
      hardware.canvas,
      hardware.screen,
      hardware.hardwareConcurrency.toString(),
      hardware.deviceMemory?.toString() || 'unknown',
      hardware.timezone,
      hardware.platform
    ]

    return this.hashString(components.join('|'))
  }

  private generateFingerprintString(flexible: FlexibleFingerprint): string {
    const components = [
      flexible.browser,
      flexible.browserVersion,
      flexible.userAgent,
      flexible.plugins.join(',')
    ]

    return this.hashString(components.join('|'))
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance normalized to 0-1 similarity
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        os: 'server',
        browser: 'server',
        platform: 'server',
        screen: '0x0',
        userAgent: 'server'
      }
    }

    const userAgent = navigator.userAgent
    let os = 'Unknown'

    if (userAgent.indexOf('Win') > -1) os = 'Windows'
    else if (userAgent.indexOf('Mac') > -1) os = 'macOS'
    else if (userAgent.indexOf('Linux') > -1) os = 'Linux'
    else if (userAgent.indexOf('Android') > -1) os = 'Android'
    else if (userAgent.indexOf('iOS') > -1) os = 'iOS'

    const flexible = this.getFlexibleFingerprint()

    return {
      os,
      browser: flexible.browser,
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`,
      userAgent
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Generate deviceId (hardware only)
      this.deviceId = await this.generateDeviceId()

      // Try to load license from server
      await this.loadFromServer()

      // Start heartbeat if license exists
      if (this.cache) {
        this.startHeartbeat()
      }

      // Setup visibility listener
      this.setupVisibilityListener()

      this.isInitialized = true
    } catch (error) {
      console.error('LicenseManager initialization error:', error)
    }
  }

  // ==========================================================================
  // SERVER COMMUNICATION
  // ==========================================================================

  async loadFromServer(): Promise<LicenseView | null> {
    try {
      if (!this.deviceId) {
        console.warn('Cannot load license: deviceId not generated')
        return null
      }

      const response = await fetch(`/api/license?deviceId=${this.deviceId}`)
      const data = await response.json()

      if (data.success && data.data) {
        this.cache = data.data
        return data.data
      }

      // No license found
      this.cache = null
      return null
    } catch (error) {
      console.error('Error loading license from server:', error)
      return null
    }
  }

  async activate(licenseKey: string, issuedTo?: string): Promise<LicenseView> {
    if (!this.deviceId) {
      this.deviceId = await this.generateDeviceId()
    }

    const input: ActivateLicenseInput = {
      licenseKey,
      deviceId: this.deviceId,
      deviceInfo: this.getDeviceInfo()
    }

    const response = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Activation failed')
    }

    // Update cache
    this.cache = data.data

    // Generate initial fingerprint
    const flexible = this.getFlexibleFingerprint()
    this.lastFingerprint = this.generateFingerprintString(flexible)

    // Start heartbeat
    this.startHeartbeat()

    return data.data
  }

  // ==========================================================================
  // HEARTBEAT
  // ==========================================================================

  startHeartbeat(intervalMs: number = 5 * 60 * 1000): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, intervalMs)

    // Send immediately on start
    this.sendHeartbeat()
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      if (!this.deviceId || !this.cache) return

      // Generate current flexible fingerprint
      const flexible = this.getFlexibleFingerprint()
      const currentFingerprint = this.generateFingerprintString(flexible)

      // Calculate similarity with last fingerprint
      const similarity = this.lastFingerprint 
        ? this.calculateSimilarity(this.lastFingerprint, currentFingerprint)
        : 1.0

      const input: HeartbeatInput = {
        deviceId: this.deviceId,
        fingerprint: currentFingerprint,
        similarity,
        usageTick: {
          type: 'ping',
          timestamp: new Date().toISOString()
        }
      }

      const response = await fetch('/api/license/heartbeat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })

      const data = await response.json()

      if (data.success) {
        this.cache = data.data
        this.lastFingerprint = currentFingerprint
      } else {
        console.warn('Heartbeat failed:', data.error)
      }
    } catch (error) {
      console.error('Heartbeat error:', error)
    }
  }

  // ==========================================================================
  // VISIBILITY LISTENER
  // ==========================================================================

  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.cache) {
        // Revalidate license when tab becomes visible
        this.loadFromServer()
      }
    })
  }

  // ==========================================================================
  // PUBLIC GETTERS
  // ==========================================================================

  getLicense(): LicenseView | null {
    return this.cache
  }

  getDeviceId(): string | null {
    return this.deviceId
  }

  hasFeature(feature: string): boolean {
    if (!this.cache || this.cache.status !== 'active') return false
    return this.cache.features.includes(feature) || this.cache.features.includes('all')
  }

  isActive(): boolean {
    return this.cache?.status === 'active'
  }

  getDaysRemaining(): number {
    return this.cache?.daysRemaining || 0
  }

  isLifetime(): boolean {
    return this.cache?.isLifetime || false
  }

  // ==========================================================================
  // LEGACY COMPATIBILITY (deprecated, will be removed)
  // ==========================================================================

  async validateOrCreateLicense(): Promise<{ isValid: boolean; license?: LicenseView }> {
    const license = await this.loadFromServer()
    return {
      isValid: license?.status === 'active',
      license: license || undefined
    }
  }

  getLicenseInfo(): LicenseView | null {
    return this.cache
  }

  isTestVersion(): boolean {
    return this.cache?.type === 'trial'
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default LicenseManager