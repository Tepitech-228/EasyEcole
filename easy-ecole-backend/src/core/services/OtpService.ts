import crypto from 'crypto'

interface OtpEntry {
  code: string
  expiresAt: number
  attempts: number
  blockedUntil: number | null
  resendAt: number
}

type VerifyResult =
  | { success: true }
  | { success: false; reason: 'blocked'; blockedUntil: Date; remainingMinutes: number }
  | { success: false; reason: 'expired' }
  | { success: false; reason: 'not_found' }
  | { success: false; reason: 'incorrect'; attemptsLeft: number }

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const OTP_TTL = 75000
const RESEND_COOLDOWN = 30000
const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 600000
const CLEANUP_INTERVAL = 30000

export class OtpService {
  private static store = new Map<string, OtpEntry>()

  static {
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL)
  }

  static generate(email: string): string {
    const existing = this.store.get(email)
    if (existing?.blockedUntil && existing.blockedUntil > Date.now()) {
      const remaining = Math.ceil((existing.blockedUntil - Date.now()) / 60000)
      throw new Error(`Compte bloqué pour ${remaining} minute(s)`)
    }

    const code = this.generateCode()
    this.store.set(email, {
      code,
      expiresAt: Date.now() + OTP_TTL,
      attempts: existing?.attempts ?? 0,
      blockedUntil: null,
      resendAt: Date.now() + RESEND_COOLDOWN,
    })

    return code
  }

  static verify(email: string, code: string): VerifyResult {
    const entry = this.store.get(email)

    if (entry?.blockedUntil && entry.blockedUntil > Date.now()) {
      const remaining = Math.ceil((entry.blockedUntil - Date.now()) / 60000)
      return { success: false, reason: 'blocked', blockedUntil: new Date(entry.blockedUntil), remainingMinutes: remaining }
    }

    if (!entry) {
      return { success: false, reason: 'not_found' }
    }

    if (entry.expiresAt < Date.now()) {
      return { success: false, reason: 'expired' }
    }

    if (entry.code.toUpperCase() !== code.toUpperCase()) {
      entry.attempts++
      if (entry.attempts >= MAX_ATTEMPTS) {
        entry.blockedUntil = Date.now() + BLOCK_DURATION
        return { success: false, reason: 'blocked', blockedUntil: new Date(entry.blockedUntil), remainingMinutes: 10 }
      }
      const attemptsLeft = MAX_ATTEMPTS - entry.attempts
      return { success: false, reason: 'incorrect', attemptsLeft }
    }

    this.store.delete(email)
    return { success: true }
  }

  static canResend(email: string): { allowed: boolean; retryAfter?: number } {
    const entry = this.store.get(email)
    if (entry?.blockedUntil && entry.blockedUntil > Date.now()) {
      return { allowed: false }
    }
    if (entry && entry.resendAt > Date.now()) {
      return { allowed: false, retryAfter: entry.resendAt - Date.now() }
    }
    return { allowed: true }
  }

  static resend(email: string): string {
    const existing = this.store.get(email)
    if (existing?.blockedUntil && existing.blockedUntil > Date.now()) {
      throw new Error('Compte bloqué')
    }

    const code = this.generateCode()
    this.store.set(email, {
      code,
      expiresAt: Date.now() + OTP_TTL,
      attempts: existing?.attempts ?? 0,
      blockedUntil: null,
      resendAt: Date.now() + RESEND_COOLDOWN,
    })

    return code
  }

  static getAttemptsInfo(email: string): { attempts: number; maxAttempts: number; blockedUntil: number | null } {
    const entry = this.store.get(email)
    return {
      attempts: entry?.attempts ?? 0,
      maxAttempts: MAX_ATTEMPTS,
      blockedUntil: entry?.blockedUntil ?? null,
    }
  }

  private static generateCode(): string {
    const bytes = crypto.randomBytes(10)
    return Array.from({ length: 10 }, (_, i) => CHARS[bytes[i] % CHARS.length]).join('')
  }

  private static cleanup(): void {
    const now = Date.now()
    for (const [email, entry] of this.store.entries()) {
      if (entry.expiresAt + 120000 < now && !entry.blockedUntil) {
        this.store.delete(email)
      }
    }
  }
}
