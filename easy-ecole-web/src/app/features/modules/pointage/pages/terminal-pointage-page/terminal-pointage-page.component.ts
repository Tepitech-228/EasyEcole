import { Component, OnDestroy } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-terminal-pointage-page',
  templateUrl: './terminal-pointage-page.component.html',
  styleUrls: ['./terminal-pointage-page.component.scss']
})
export class TerminalPointagePageComponent extends BaseComponentClass implements OnDestroy {
  todayPointage: any = null
  loading: boolean = true
  scanning: boolean = false
  scanMode: 'arrivee' | 'depart' = 'arrivee'
  scannedUser: any = null
  scanError: string = ''
  scanSuccess: string = ''
  scanTimeout: boolean = false
  selfSuccess: string = ''
  selfError: string = ''
  manualId: string = ''
  showManualInput: boolean = false
  private html5QrCode: Html5Qrcode | null = null
  private scanTimer: any = null
  private static readonly SCAN_TIMEOUT_MS = 30000
  private static readonly CACHE_TTL_MS = 60000
  private audioCtx: AudioContext | null = null

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(private pointageService: PointageService) {
    super()
    this.loadTodayPointage()
  }

  ngOnDestroy(): void {
    this.stopScanner()
    this.clearScanTimer()
    if (this.audioCtx) {
      this.audioCtx.close()
    }
  }

  private playBeep(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.type = 'sine'
      osc.frequency.value = 1200
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15)
      osc.start()
      osc.stop(this.audioCtx.currentTime + 0.15)
    } catch {}
    try {
      navigator.vibrate(150)
    } catch {}
  }

  private playTone(startTime: number, frequency: number, duration: number): void {
    const audioCtx = this.audioCtx
    if (!audioCtx) return
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  /** Succès : 2 bips brefs aigus (1568 Hz / G6) */
  private playBeepSucces(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }
      const now = this.audioCtx.currentTime
      this.playTone(now, 1568, 0.09)
      this.playTone(now + 0.12, 1568, 0.09)
    } catch {}
    try {
      navigator.vibrate(150)
    } catch {}
  }

  /** Refus / erreur : double-bip grave (2 x 392 Hz / G4, ~0,15 s, espacés ~0,12 s) */
  private playBeepRefus(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }
      const now = this.audioCtx.currentTime
      this.playTone(now, 392, 0.15)
      this.playTone(now + 0.27, 392, 0.15)
    } catch {}
    try {
      navigator.vibrate([150, 60, 150])
    } catch {}
  }

  private getCacheKey(codeQR: string): string {
    return 'scan_cache_' + codeQR
  }

  private getCachedResult(codeQR: string): any {
    const raw = sessionStorage.getItem(this.getCacheKey(codeQR))
    if (!raw) return null
    try {
      const data = JSON.parse(raw)
      if (Date.now() - data.timestamp < TerminalPointagePageComponent.CACHE_TTL_MS) {
        return data.result
      }
      sessionStorage.removeItem(this.getCacheKey(codeQR))
    } catch {}
    return null
  }

  private setCachedResult(codeQR: string, result: any): void {
    try {
      sessionStorage.setItem(this.getCacheKey(codeQR), JSON.stringify({
        result,
        timestamp: Date.now()
      }))
    } catch {}
  }

  private clearScanTimer(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer)
      this.scanTimer = null
    }
  }

  private loadTodayPointage(): void {
    this.loading = true
    this.pointageService.getToday().subscribe({
      next: (res) => {
        this.todayPointage = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  pointerArrivee(): void {
    this.pointageService.pointerArrivee().subscribe({
      next: (res) => {
        this.todayPointage = res
        this.selfSuccess = 'Arrivée pointée à ' + res.heureArrivee
        this.playBeepSucces()
        setTimeout(() => this.selfSuccess = '', 4000)
      },
      error: (err) => {
        this.selfError = err.error?.message || 'Erreur lors du pointage'
        this.playBeepRefus()
        setTimeout(() => this.selfError = '', 4000)
      }
    })
  }

  pointerDepart(): void {
    this.pointageService.pointerDepart().subscribe({
      next: (res) => {
        this.todayPointage = res
        this.selfSuccess = 'Départ pointé à ' + res.heureDepart
        this.playBeepSucces()
        setTimeout(() => this.selfSuccess = '', 4000)
      },
      error: (err) => {
        this.selfError = err.error?.message || 'Erreur lors du pointage'
        this.playBeepRefus()
        setTimeout(() => this.selfError = '', 4000)
      }
    })
  }

  startScanner(mode: 'arrivee' | 'depart'): void {
    this.scanMode = mode
    this.scannedUser = null
    this.scanError = ''
    this.scanSuccess = ''
    this.scanTimeout = false
    this.showManualInput = false
    this.scanning = true
    this.html5QrCode = new Html5Qrcode('qr-reader-pointage')

    this.clearScanTimer()
    this.scanTimer = setTimeout(() => {
      this.stopScanner()
      this.scanTimeout = true
    }, TerminalPointagePageComponent.SCAN_TIMEOUT_MS)

    this.html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => this.onScanSuccess(decodedText),
      () => {}
    ).catch(() => {
      this.clearScanTimer()
      this.scanError = 'Impossible d\'accéder à la caméra'
      this.scanning = false
    })
  }

  stopScanner(): void {
    this.clearScanTimer()
    if (this.html5QrCode) {
      this.html5QrCode.stop().catch(() => {})
      this.html5QrCode = null
    }
    this.scanning = false
  }

  private onScanSuccess(decodedText: string): void {
    this.playBeep()
    this.stopScanner()
    const cached = this.getCachedResult(decodedText)
    if (cached) {
      this.displayScannedResult(cached)
      return
    }
    this.verifierStatut(decodedText)
  }

  private displayScannedResult(res: any): void {
    if (res.statut === 'rouge') {
      this.scanError = res.message || 'Accès refusé'
      this.playBeepRefus()
    } else {
      this.playBeepSucces()
      this.scannedUser = {
        userId: res.utilisateurId,
        nom: res.nom || 'Inconnu',
        prenoms: res.prenoms || '',
        role: res.role || 'apprenant',
        statut: 'vert',
        message: res.message,
        photo: res.photo || '',
        photoUrl: res.photo ? this.PHOTOS_PATH + res.photo : 'assets/images/blank-profile-picture.png'
      }
    }
  }

  verifierParIdManuel(): void {
    if (!this.manualId.trim()) return
    this.verifierStatut(this.manualId.trim())
    this.showManualInput = false
  }

  private verifierStatut(codeQR: string): void {
    this.scannedUser = null
    this.scanError = ''
    this.scanSuccess = ''
    this.pointageService.verifierStatutByQR(codeQR).subscribe({
      next: (res) => {
        this.setCachedResult(codeQR, res)
        this.displayScannedResult(res)
      },
      error: (err) => {
        this.scanError = err.error?.message || 'Utilisateur non trouvé'
        this.playBeepRefus()
      }
    })
  }

  pointerScannedUser(mode: 'arrivee' | 'depart'): void {
    if (!this.scannedUser?.userId) return
    const serviceCall = mode === 'arrivee'
      ? this.pointageService.pointerArriveeByScan(this.scannedUser.userId)
      : this.pointageService.pointerDepartByScan(this.scannedUser.userId)

    serviceCall.subscribe({
      next: (res) => {
        this.playBeepSucces()
        this.scanSuccess = mode === 'arrivee'
          ? 'Arrivée pointée à ' + res.heureArrivee
          : 'Départ pointé à ' + res.heureDepart
        this.scannedUser = null
        setTimeout(() => this.scanSuccess = '', 4000)
      },
      error: (err) => {
        this.playBeepRefus()
        if (err.error?.alreadyExists) {
          this.scanError = mode === 'arrivee'
            ? 'Arrivée déjà pointée aujourd\'hui'
            : 'Départ déjà pointé aujourd\'hui'
        } else {
          this.scanError = err.error?.message || 'Erreur lors du pointage'
        }
        setTimeout(() => this.scanError = '', 4000)
      }
    })
  }

  resetScan(): void {
    this.scannedUser = null
    this.scanError = ''
    this.scanSuccess = ''
    this.scanTimeout = false
    this.manualId = ''
    this.showManualInput = false
  }
}
