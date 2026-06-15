import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PresenceService } from 'src/app/data/modules/inscription/services/presence.service';

@Component({
  selector: 'app-scan-presence-page',
  templateUrl: './scan-presence-page.component.html',
  styleUrls: ['./scan-presence-page.component.scss']
})
export class ScanPresencePageComponent extends BaseComponentClass implements OnDestroy {
  presenceId: string = ''
  scanning: boolean = false
  scannedUserId: string | null = null
  scannedUserNom: string = ''
  errorMessage: string = ''
  successMessage: string = ''
  private html5QrCode: Html5Qrcode | null = null

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

  private markPresence(userId: string): void {
    this.presenceService.scanPresence(this.presenceId, userId).subscribe({
      next: (res: any) => {
        this.successMessage = 'Présence marquée avec succès'
        this.scannedUserNom = 'Étudiant'
        setTimeout(() => {
          this.scannedUserId = null
          this.successMessage = ''
          this.errorMessage = ''
          this.startScanner()
        }, 2000)
      },
      error: (err) => {
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
