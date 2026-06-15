import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Apprenant } from 'src/app/data/modules/auth/models/Apprenant.model';
import { ApprenantService } from 'src/app/data/modules/auth/services/apprenant.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-qr-codes-page',
  templateUrl: './qr-codes-page.component.html',
  styleUrls: ['./qr-codes-page.component.scss']
})
export class QrCodesPageComponent extends BaseComponentClass {
  apprenants: Apprenant[] = []
  loading: boolean = false
  generating: boolean = false
  readonly QR_CODES_PATH: string = environment.QR_CODES_PATH

  constructor(private apprenantService: ApprenantService) {
    super()
    this.loadApprenants()
  }

  private loadApprenants(): void {
    this.loading = true
    this.apprenantService.getAll().subscribe({
      next: (res) => {
        this.apprenants = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  generateQrCodes(): void {
    this.generating = true
    this.apprenantService.generateQrCodes().subscribe({
      next: () => {
        this.loadApprenants()
        this.generating = false
      },
      error: () => { this.generating = false }
    })
  }
}
