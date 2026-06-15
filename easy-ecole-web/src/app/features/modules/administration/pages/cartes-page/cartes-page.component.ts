import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Apprenant } from 'src/app/data/modules/auth/models/Apprenant.model';
import { ApprenantService } from 'src/app/data/modules/auth/services/apprenant.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cartes-page',
  templateUrl: './cartes-page.component.html',
  styleUrls: ['./cartes-page.component.scss']
})
export class CartesPageComponent extends BaseComponentClass {
  apprenants: Apprenant[] = []
  loading: boolean = false
  selectedApprenant: Apprenant | null = null
  showPrintModal: boolean = false

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
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

  getCursus(apprenant: Apprenant): any {
    return apprenant.utilisateur?.cursusApprenant?.[0]
  }

  getMatricule(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.demandeInscription?.matricule || apprenant.utilisateur?.identifiant || '---'
  }

  getParcours(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.parcours?.titre || '---'
  }

  getAnneeScolaire(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.anneeAcademique?.libelle || (apprenant.createdAt ? new Date(apprenant.createdAt).getFullYear().toString() : '---')
  }

  getClasse(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.classe?.libelle || '---'
  }

  openCard(apprenant: Apprenant): void {
    this.selectedApprenant = apprenant
    this.showPrintModal = true
  }

  closeCard(): void {
    this.showPrintModal = false
    this.selectedApprenant = null
  }

  printCard(): void {
    window.print()
  }
}
