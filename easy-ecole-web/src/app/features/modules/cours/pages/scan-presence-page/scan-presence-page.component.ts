import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PresenceService } from 'src/app/data/modules/inscription/services/presence.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-scan-presence-page',
  templateUrl: './scan-presence-page.component.html',
  styleUrls: ['./scan-presence-page.component.scss']
})
export class ScanPresencePageComponent extends BaseComponentClass implements OnDestroy {
  presenceId: string = ''
  scanning: boolean = false
  scannedUser: any = null
  scannedUserId: string | null = null
  scannedUserNom: string = ''
  scannedUserPrenoms: string = ''
  scannedUserPhoto: string = ''
  errorMessage: string = ''
  successMessage: string = ''
  paiementStatut: 'vert' | 'rouge' | null = null
  paiementEcheancesEnRetard: number = 0
  paiementMessage: string = ''
  private html5QrCode: Html5Qrcode | null = null
  private audioCtx: AudioContext | null = null

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private presenceService: PresenceService
  ) {
    super()
    this.presenceId = this.route.snapshot.paramMap.get('id') || ''
    this.startScanner()
  }

  ngOnDestroy(): void {
    this.stopScanner()
    if (this.audioCtx) {
      this.audioCtx.close()
    }
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

  startScanner(): void {
    this.scanning = true
    this.html5QrCode = new Html5Qrcode('qr-reader')

    this.html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => this.onScanSuccess(decodedText),
      () => {}
    ).catch(() => {
      this.errorMessage = 'Impossible d\'accéder à la caméra'
      this.scanning = false
    })
  }

  stopScanner(): void {
    if (this.html5QrCode) {
      this.html5QrCode.stop().catch(() => {})
      this.html5QrCode = null
    }
    this.scanning = false
  }

  private onScanSuccess(decodedText: string): void {
    this.stopScanner()
    this.scannedUserId = decodedText
    this.markPresence(decodedText)
  }

  private markPresence(codeQR: string): void {
    this.presenceService.scanPresence(this.presenceId, codeQR).subscribe({
      next: (res: any) => {
        this.successMessage = 'Présence marquée avec succès'
        const paiement = res?.paiement
        if (paiement?.statut === 'rouge') {
          this.paiementStatut = 'rouge'
          this.paiementEcheancesEnRetard = paiement.echeancesEnRetard ?? 0
          this.paiementMessage = paiement.message || ''
          this.playBeepRefus()
        } else {
          this.paiementStatut = 'vert'
          this.playBeepSucces()
        }
        if (res?.data) {
          this.scannedUserNom = res.data.nom || 'Étudiant'
          this.scannedUserPrenoms = res.data.prenoms || ''
          this.scannedUserPhoto = res.data.photo ? (this.PHOTOS_PATH + res.data.photo) : ''
        } else {
          this.scannedUserNom = 'Étudiant'
        }
        this.scannedUser = {
          nom: this.scannedUserNom,
          prenoms: this.scannedUserPrenoms,
          photo: this.scannedUserPhoto
        }
        setTimeout(() => {
          this.scannedUserId = null
          this.scannedUser = null
          this.successMessage = ''
          this.errorMessage = ''
          this.paiementStatut = null
          this.paiementEcheancesEnRetard = 0
          this.paiementMessage = ''
          this.startScanner()
        }, 2000)
      },
      error: (err) => {
        this.playBeepRefus()
        if (err.error?.alreadyExists) {
          this.errorMessage = 'Cet étudiant est déjà marqué présent'
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors du marquage de présence'
        }
        setTimeout(() => {
          this.scannedUserId = null
          this.errorMessage = ''
          this.startScanner()
        }, 2000)
      }
    })
  }

  goBack(): void {
    this.stopScanner()
    this.router.navigate(['/cours/presences', this.presenceId])
  }
}
