import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ValidationService } from 'src/app/data/modules/achats/services/validation.service';
import { DemandeAchat, getMontantDemande, getNomUtilisateur } from 'src/app/data/modules/achats/models/achats.models';

@Component({
  selector: 'app-validations-page',
  templateUrl: './validations-page.component.html',
  styleUrls: ['./validations-page.component.scss']
})
export class ValidationsPageComponent extends BaseComponentClass implements OnInit {
  validations: any[] = []
  loading = false
  searchTerm = ''

  constructor(private validationService: ValidationService) { super() }

  ngOnInit(): void {
    this.loadValidations()
  }

  loadValidations() {
    this.loading = true
    this.validationService.getValidationsEnAttente().subscribe({
      next: (demandes: DemandeAchat[]) => {
        this.validations = demandes.map(d => ({
          id: d.id,
          demandeId: 'DEM-' + d.id,
          description: d.description,
          demandeur: getNomUtilisateur(d.soumisPar),
          montant: getMontantDemande(d),
          dateSoumission: d.dateSoumission,
          // Les demandes filtrées par le backend sont au statut "soumise" (= en attente)
          statut: 'en_attente',
        }))
        this.loading = false
      },
      error: () => {
        this.validations = []
        this.loading = false
      }
    })
  }

  get enAttenteCount(): number {
    return this.validations.filter(v => v.statut === 'en_attente').length
  }

  get valideesCount(): number {
    return this.validations.filter(v => v.statut === 'validee').length
  }

  get rejeteesCount(): number {
    return this.validations.filter(v => v.statut === 'rejetee').length
  }

  getStatutBadge(statut: string): string {
    const map: any = { en_attente: 'bg-yellow-100 text-yellow-700', validee: 'bg-green-100 text-green-700', rejetee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }

  valider(id: number) {
    this.validationService.approuver(id).subscribe({
      next: () => {
        const idx = this.validations.findIndex(v => v.id === id)
        if (idx > -1) this.validations[idx].statut = 'validee'
      },
      error: () => {}
    })
  }

  rejeter(id: number) {
    this.validationService.rejeter(id).subscribe({
      next: () => {
        const idx = this.validations.findIndex(v => v.id === id)
        if (idx > -1) this.validations[idx].statut = 'rejetee'
      },
      error: () => {}
    })
  }
}
