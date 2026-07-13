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
  dateDelivrance: string = ''

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly QR_CODES_PATH: string = environment.QR_CODES_PATH

  constructor(private apprenantService: ApprenantService) {
    super()
    this.dateDelivrance = this.formatDate(new Date())
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

  getFiliere(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.parcours?.titre?.split(' ')[0] || '---'
  }

  getAnneeScolaire(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.anneeAcademique?.libelle || (apprenant.createdAt ? new Date(apprenant.createdAt).getFullYear().toString() : '---')
  }

  getClasse(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.classe?.libelle || '---'
  }

  getNiveau(apprenant: Apprenant): string {
    const niveau = this.getCursus(apprenant)?.niveauEtude?.libelle
    if (niveau) return niveau
    const classe = this.getClasse(apprenant)
    if (classe.toLowerCase().includes('licence')) return classe
    if (classe.toLowerCase().includes('master')) return classe
    return classe || '---'
  }

  getSexe(apprenant: Apprenant): string {
    return apprenant.identite?.nationalite ? 'F' : '---'
  }

  getDateNaissance(apprenant: Apprenant): string {
    if (!apprenant.dateNaissance) return '---'
    const d = new Date(apprenant.dateNaissance)
    return ('0' + d.getDate()).slice(-2) + ' / ' + ('0' + (d.getMonth() + 1)).slice(-2) + ' / ' + d.getFullYear()
  }

  getUrgenceNom(apprenant: Apprenant): string {
    return apprenant.personnePrevenir?.nom || '---'
  }

  getUrgencePrenoms(apprenant: Apprenant): string {
    return apprenant.personnePrevenir?.prenoms || '---'
  }

  getUrgenceTel(apprenant: Apprenant): string {
    return apprenant.personnePrevenir?.telMobile || '---'
  }

  getUrgenceLien(apprenant: Apprenant): string {
    return '---'
  }

  private formatDate(date: Date): string {
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    const d = date.getDate()
    const m = months[date.getMonth()]
    const y = date.getFullYear()
    return d + ' ' + m + ' ' + y
  }

  onPhotoSelected(apprenant: Apprenant, event: any): void {
    const file = event.target?.files?.[0]
    if (!file) return
    event.target.value = ''

    this.apprenantService.updatePhoto(file, apprenant.id as any).subscribe({
      next: (res) => {
        if (res?.photo) {
          apprenant.photo = res.photo
        }
      },
      error: () => {}
    })
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
