import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-validations-page',
  templateUrl: './validations-page.component.html',
  styleUrls: ['./validations-page.component.scss']
})
export class ValidationsPageComponent extends BaseComponentClass implements OnInit {
  validations: any[] = []
  loading = false
  searchTerm = ''

  constructor() { super() }

  ngOnInit(): void {
    this.loadValidations()
  }

  loadValidations() {
    this.loading = true
    setTimeout(() => {
      this.validations = [
        { id: 1, demandeId: 'DEM-001', description: 'Achat ordinateurs', montant: 2500000, demandeur: 'M. Dupont', dateSoumission: '2026-01-15', statut: 'en_attente' },
        { id: 2, demandeId: 'DEM-002', description: 'Fournitures bureau', montant: 150000, demandeur: 'Mme Martin', dateSoumission: '2026-01-18', statut: 'validee' },
      ]
      this.loading = false
    }, 500)
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
    const idx = this.validations.findIndex(v => v.id === id)
    if (idx > -1) this.validations[idx].statut = 'validee'
  }

  rejeter(id: number) {
    const idx = this.validations.findIndex(v => v.id === id)
    if (idx > -1) this.validations[idx].statut = 'rejetee'
  }
}
