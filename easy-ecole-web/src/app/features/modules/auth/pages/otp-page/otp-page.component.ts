import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

@Component({
  selector: 'app-otp-page',
  templateUrl: './otp-page.component.html',
  styleUrls: ['./otp-page.component.scss']
})
export class OtpPageComponent implements OnInit, OnDestroy {
  email: string = ''
  maskedEmail: string = ''
  mode: 'connexion' | 'inscription' = 'connexion'

  codeInputs: string[] = Array(4).fill('')
  private isSubmitting: boolean = false

  readonly circleCircumference: number = 2 * Math.PI * 40

  timeLeft: number = 75
  totalTime: number = 75
  private timerInterval: any

  canResend: boolean = false
  resendCooldown: number = 30
  private resendInterval: any

  attemptsMade: number = 0
  maxAttempts: number = 5
  attemptsLeft: number = 5

  state: 'idle' | 'verifying' | 'success' | 'error' | 'blocked' = 'idle'
  errorMessage: string = ''
  blockedUntil: Date | null = null
  blockedCountdown: string = ''
  private blockedInterval: any

  get isExpired(): boolean { return this.timeLeft <= 0 }

  get timerColor(): string {
    if (this.timeLeft > 30) return '#22c55e'
    if (this.timeLeft > 15) return '#eab308'
    if (this.timeLeft > 5) return '#f97316'
    return '#ef4444'
  }

  get isUrgent(): boolean { return this.timeLeft <= 15 && this.timeLeft > 5 }
  get isCritical(): boolean { return this.timeLeft <= 5 && this.timeLeft > 0 }

  get dashOffset(): number {
    return this.circleCircumference * (1 - this.timeLeft / this.totalTime)
  }

  get timerText(): string {
    const s = Math.max(0, Math.ceil(this.timeLeft))
    return `${s}s`
  }

  get statusConfig(): { text: string; type: string; icon: string } {
    if (this.state === 'blocked') {
      return {
        text: `Compte temporairement bloqué. Réessayez dans ${this.blockedCountdown}.`,
        type: 'blocked',
        icon: 'lock'
      }
    }
    if (this.isExpired && this.state !== 'verifying') {
      return {
        text: 'Code expiré. Cliquez sur "Renvoyer" pour en obtenir un nouveau.',
        type: 'warning',
        icon: 'timer'
      }
    }
    if (this.state === 'verifying') {
      return { text: 'Vérification en cours...', type: 'info', icon: 'spinner' }
    }
    if (this.state === 'success') {
      return { text: 'Connexion réussie !', type: 'success', icon: 'check' }
    }

    switch (this.attemptsMade) {
      case 0:
        return {
          text: `Un code à 4 caractères a été envoyé à ${this.maskedEmail}. Vérifiez votre boîte de réception et vos spams.`,
          type: 'info',
          icon: 'mail'
        }
      case 1:
        return {
          text: `Code incorrect. Il vous reste ${this.attemptsLeft} tentatives avant blocage.`,
          type: 'info',
          icon: 'info'
        }
      case 2:
        return {
          text: `Code incorrect. ${this.attemptsLeft} tentatives restantes.`,
          type: 'warning',
          icon: 'alert'
        }
      case 3:
        return {
          text: `Attention : plus que ${this.attemptsLeft} tentatives. Vérifiez bien votre code.`,
          type: 'warning',
          icon: 'alert-triangle'
        }
      case 4:
        return {
          text: 'DERNIÈRE TENTATIVE — Si le code est incorrect, votre compte sera bloqué 10 minutes.',
          type: 'danger',
          icon: 'alert-octagon'
        }
      default:
        return { text: '', type: 'info', icon: 'info' }
    }
  }

  get isLastAttempt(): boolean { return this.attemptsMade === 4 }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    if (this.localStorageService.get(LocalStorageService.AUTH_TOKEN)) {
      this.router.navigate(['/'])
      return
    }
    this.route.queryParams.subscribe(params => {
      this.email = params['email']
      this.maskedEmail = params['maskedEmail'] || this.maskEmail(this.email)
      this.mode = params['mode'] || 'connexion'
      if (!this.email) {
        this.router.navigate(['/auth/connexion'])
      }
    })
    this.startTimer()
  }

  onInput(index: number, event: any): void {
    const input = event.target as HTMLInputElement
    const char = input.value.toUpperCase()

    if (char && /^[A-Z0-9]$/i.test(char)) {
      this.codeInputs[index] = char
      if (index < 3) {
        const next = document.getElementById(`otp-${index + 1}`)
        next?.focus()
      }
      if (this.codeInputs.every(c => c !== '')) {
        this.verifyCode()
      }
    } else {
      input.value = ''
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      this.codeInputs[index] = ''
      if (index > 0) {
        const prev = document.getElementById(`otp-${index - 1}`)
        prev?.focus()
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      prev?.focus()
    }
    if (event.key === 'ArrowRight' && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault()
    const paste = event.clipboardData?.getData('text').replace(/[^A-Z0-9]/gi, '').toUpperCase()
    if (paste && paste.length === 4) {
      this.codeInputs = paste.split('')
      this.verifyCode()
    }
  }

  verifyCode(): void {
    if (this.isSubmitting || this.state === 'verifying' || this.state === 'success') return

    this.isSubmitting = true
    this.state = 'verifying'
    this.errorMessage = ''
    const code = this.codeInputs.join('')

    this.authService.verifyOtp(this.email, code).subscribe({
      next: (res) => {
        this.isSubmitting = false
        this.state = 'success'
        this.localStorageService.set(LocalStorageService.AUTH_TOKEN, res.token)
        this.stopTimers()
        setTimeout(() => {
          location.reload();
        }, 1200)
      },
      error: (err) => {
        this.isSubmitting = false
        if (err.error?.error === 'account_blocked') {
          this.state = 'blocked'
          this.blockedUntil = new Date(err.error.blockedUntil)
          this.startBlockedCountdown()
          this.stopTimers()
          return
        }
        this.attemptsMade++
        this.attemptsLeft = Math.max(0, this.maxAttempts - this.attemptsMade)
        this.codeInputs = Array(4).fill('')
        this.state = 'idle'
        setTimeout(() => document.getElementById('otp-0')?.focus(), 100)
      }
    })
  }

  resendCode(): void {
    if (!this.canResend || this.state === 'verifying') return

    this.canResend = false
    this.authService.resendOtp(this.email).subscribe({
      next: (res) => {
        this.codeInputs = Array(4).fill('')
        this.timeLeft = 75
        this.state = 'idle'
        this.errorMessage = ''
        this.startTimer()
        this.startResendCooldown()
        this.attemptsLeft = res.attemptsLeft
        setTimeout(() => document.getElementById('otp-0')?.focus(), 100)
      },
      error: (err) => {
        if (err.error?.error === 'resend_cooldown') {
          this.startResendCooldown(err.error.retryAfter / 1000)
        }
        this.canResend = true
      }
    })
  }

  retour(): void {
    this.stopTimers()
    this.router.navigate(['/auth/connexion'])
  }

  private startTimer(): void {
    this.stopTimer()
    this.timerInterval = setInterval(() => {
      this.timeLeft--
      if (this.timeLeft <= 0) {
        this.canResend = true
        this.stopTimer()
      }
    }, 1000)
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  private startResendCooldown(duration: number = 30): void {
    this.stopResendCooldown()
    this.resendCooldown = duration
    this.canResend = false
    this.resendInterval = setInterval(() => {
      this.resendCooldown--
      if (this.resendCooldown <= 0) {
        this.canResend = true
        this.stopResendCooldown()
      }
    }, 1000)
  }

  private stopResendCooldown(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval)
      this.resendInterval = null
    }
  }

  private startBlockedCountdown(): void {
    this.stopBlockedCountdown()
    this.blockedInterval = setInterval(() => {
      const diff = this.blockedUntil!.getTime() - Date.now()
      if (diff <= 0) {
        this.state = 'idle'
        this.attemptsMade = 0
        this.attemptsLeft = 5
        this.stopBlockedCountdown()
        this.router.navigate(['/auth/connexion'])
        return
      }
      const min = Math.floor(diff / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      this.blockedCountdown = `${min}:${sec.toString().padStart(2, '0')}`
    }, 1000)
  }

  private stopBlockedCountdown(): void {
    if (this.blockedInterval) {
      clearInterval(this.blockedInterval)
      this.blockedInterval = null
    }
  }

  private stopTimers(): void {
    this.stopTimer()
    this.stopResendCooldown()
    this.stopBlockedCountdown()
  }

  private maskEmail(email: string): string {
    if (!email) return ''
    const [local, domaine] = email.split('@')
    if (local.length <= 2) return `${local[0]}***@${domaine}`
    return `${local[0]}***${local[local.length - 1]}@${domaine}`
  }

  ngOnDestroy(): void {
    this.stopTimers()
  }
}
