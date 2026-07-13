import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-enseignant-qr-codes-page',
  templateUrl: './enseignant-qr-codes-page.component.html',
  styleUrls: ['./enseignant-qr-codes-page.component.scss']
})
export class EnseignantQrCodesPageComponent extends BaseComponentClass {
  enseignants: Enseignant[] = []
  loading: boolean = false
  generating: boolean = false
  readonly QR_CODES_PATH: string = environment.QR_CODES_ENSEIGNANTS_PATH

  constructor(private enseignantService: EnseignantService) {
    super()
    this.loadEnseignants()
  }

  private loadEnseignants(): void {
    this.loading = true
    this.enseignantService.getAll().subscribe({
      next: (res) => {
        this.enseignants = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  generateQrCodes(): void {
    this.generating = true
    this.enseignantService.generateQrCodes().subscribe({
      next: () => {
        this.loadEnseignants()
        this.generating = false
      },
      error: () => { this.generating = false }
    })
  }
}
