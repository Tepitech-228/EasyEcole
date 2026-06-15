import { Component, OnDestroy } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';

@Component({
  selector: 'app-terminal-pointage-page',
  templateUrl: './terminal-pointage-page.component.html',
  styleUrls: ['./terminal-pointage-page.component.scss']
})
export class TerminalPointagePageComponent extends BaseComponentClass implements OnDestroy {
  todayPointage: any = null
  loading: boolean = true
  scanning: boolean = false
  scannedUserId: string | null = null
  errorMessage: string = ''
  successMessage: string = ''
  private html5QrCode: Html5Qrcode | null = null

  constructor(private pointageService: PointageService) {
    super()
    this.loadTodayPointage()
  }

  ngOnDestroy(): void {
    this.stopScanner()
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
        this.successMessage = 'Arrivée pointée à ' + res.heureArrivee
        setTimeout(() => this.successMessage = '', 3000)
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du pointage'
        setTimeout(() => this.errorMessage = '', 3000)
      }
    })
  }

  pointerDepart(): void {
    this.pointageService.pointerDepart().subscribe({
      next: (res) => {
        this.todayPointage = res
        this.successMessage = 'Départ pointé à ' + res.heureDepart
        setTimeout(() => this.successMessage = '', 3000)
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du pointage'
        setTimeout(() => this.errorMessage = '', 3000)
      }
    })
  }

  startScanner(): void {
    this.scanning = true
    this.html5QrCode = new Html5Qrcode('qr-reader-pointage')

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
    this.pointageService.pointerArriveeByScan(decodedText).subscribe({
      next: () => {
        this.successMessage = 'Pointage enregistré pour l\'utilisateur'
        setTimeout(() => {
          this.successMessage = ''
          this.scannedUserId = null
        }, 2000)
      },
      error: (err) => {
        if (err.error?.alreadyExists) {
          this.errorMessage = 'Pointage déjà effectué aujourd\'hui'
        } else {
          this.errorMessage = 'Erreur: utilisateur non trouvé'
        }
        setTimeout(() => {
          this.errorMessage = ''
          this.scannedUserId = null
        }, 2000)
      }
    })
  }
}
