/**
 * Global Rate Limiting Manager
 * Gestisce il rate limiting a livello globale per evitare loop infiniti
 */

class RateLimitManager {
  private rateLimitedUntil: number = 0
  private globalBlackedOut: boolean = false
  private listeners: Set<() => void> = new Set()
  
  // Controlla se siamo attualmente in rate limiting
  isRateLimited(): boolean {
    const now = Date.now()
    if (now >= this.rateLimitedUntil) {
      if (this.globalBlackedOut) {
        this.globalBlackedOut = false
        this.notifyListeners()
        console.log('🟢 Rate limiting cleared globally')
      }
      return false
    }
    return true
  }

  // Attiva il rate limiting globale
  activateRateLimit(durationMs: number = 3 * 60 * 1000): void {
    const now = Date.now()
    this.rateLimitedUntil = now + durationMs
    
    if (!this.globalBlackedOut) {
      this.globalBlackedOut = true
      console.warn(`🔴 Global rate limiting activated for ${Math.ceil(durationMs / 1000)}s`)
      this.notifyListeners()
    }
  }

  // Ottieni il tempo rimanente in secondi
  getRemainingTime(): number {
    if (!this.isRateLimited()) return 0
    return Math.ceil((this.rateLimitedUntil - Date.now()) / 1000)
  }

  // Reset rate limiting
  reset(): void {
    this.rateLimitedUntil = 0
    if (this.globalBlackedOut) {
      this.globalBlackedOut = false
      this.notifyListeners()
      console.log('🟢 Rate limiting reset globally')
    }
  }

  // Registra listener per cambiamenti di stato
  addListener(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback())
  }

  // Wrapper per controllare se una operazione può essere eseguita
  canMakeRequest(operationType: string = 'generic'): boolean {
    if (this.isRateLimited()) {
      const remaining = this.getRemainingTime()
      console.log(`⚠️ ${operationType} blocked by global rate limiting (${remaining}s remaining)`)
      return false
    }
    return true
  }
}

// Singleton instance
export const rateLimitManager = new RateLimitManager()

// Utility function per facilità d'uso
export const checkRateLimit = (operationType: string = 'API call'): boolean => {
  return rateLimitManager.canMakeRequest(operationType)
}

export const activateGlobalRateLimit = (durationMs?: number): void => {
  rateLimitManager.activateRateLimit(durationMs)
}