import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PersonnelAdministratif } from 'src/app/data/modules/auth/models/PersonnelAdministratif.model';
import { PersonnelAdministratifService } from 'src/app/data/modules/auth/services/personnel-administratif.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-personnel-qr-codes-page',
  templateUrl: './personnel-qr-codes-page.component.html',
  styleUrls: ['./personnel-qr-codes-page.component.scss']
})
export class PersonnelQrCodesPageComponent extends BaseComponentClass {
  personnels: PersonnelAdministratif[] = []
  loading: boolean = false
  generating: boolean = false
  readonly QR_CODES_PATH: string = environment.QR_CODES_PERSONNEL_PATH

  constructor(private personnelAdministratifService: PersonnelAdministratifService) {
    super()
    this.loadPersonnels()
  }

  private loadPersonnels(): void {
    this.loading = true
    this.personnelAdministratifService.getAll().subscribe({
      next: (res) => {
        this.personnels = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  generateQRs(): void {
    this.generating = true
    this.personnelAdministratifService.generateQRs().subscribe({
      next: () => {
        this.loadPersonnels()
        this.generating = false
      },
      error: () => { this.generating = false }
    })
  }
}
