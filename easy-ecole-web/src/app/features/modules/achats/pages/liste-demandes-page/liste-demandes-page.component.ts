import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {
  demandes: any[] = []
  loading = false
  searchTerm = ''
  filterStatut = ''

  constructor() { super() }

  ngOnInit(): void {
    this.loadDemandes()
  }

  loadDemandes() {
    this.loading = true
    setTimeout(() => {
      this.demandes = [
        { id: 1, description: 'Achat ordinateurs', statut: 'brouillon', dateSoumission: '2026-01-15', montantEstime: 2500000, demandeur: 'M. Dupont' },
        { id: 2, description: 'Fournitures bureau', statut: 'soumise', dateSoumission: '2026-01-18', montantEstime: 150000, demandeur: 'Mme Martin' },
        { id: 3, description: 'Matériel didactique', statut: 'validee', dateSoumission: '2026-01-20', montantEstime: 800000, demandeur: 'M. Bernard' },
      ]
      this.loading = false
    }, 500)
  }

  get total(): number { return this.demandes.length }
  get brouillons(): number { return this.demandes.filter(d => d.statut === 'brouillon').length }
  get soumises(): number { return this.demandes.filter(d => d.statut === 'soumise').length }
  get validees(): number { return this.demandes.filter(d => d.statut === 'validee').length }

  getStatutBadge(statut: string): string {
    const map: any = { brouillon: 'bg-gray-100 text-gray-700', soumise: 'bg-yellow-100 text-yellow-700', validee: 'bg-green-100 text-green-700', rejetee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
