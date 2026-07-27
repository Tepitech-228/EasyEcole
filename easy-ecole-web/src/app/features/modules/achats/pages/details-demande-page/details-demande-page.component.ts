import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-details-demande-page',
  templateUrl: './details-demande-page.component.html',
  styleUrls: ['./details-demande-page.component.scss']
})
export class DetailsDemandePageComponent extends BaseComponentClass implements OnInit {
  loading = false
  demande: any = null

  constructor() { super() }

  ngOnInit(): void {
    this.loadDemande()
  }

  loadDemande() {
    this.loading = true
    setTimeout(() => {
      this.demande = {
        id: 1,
        description: 'Achat ordinateurs portables',
        statut: 'soumise',
        demandeur: 'M. Dupont',
        dateSoumission: '2026-01-15',
        montantEstime: 2500000,
        lignes: [
          { designation: 'Ordinateur portable i5', quantite: 10, prixEstime: 250000, unite: 'Unité', total: 2500000 }
        ]
      }
      this.loading = false
    }, 500)
  }

  getStatutBadge(statut: string): string {
    const map: any = { brouillon: 'bg-gray-100 text-gray-700', soumise: 'bg-yellow-100 text-yellow-700', validee: 'bg-green-100 text-green-700', rejetee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
