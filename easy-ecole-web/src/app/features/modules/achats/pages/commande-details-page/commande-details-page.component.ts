import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-commande-details-page',
  templateUrl: './commande-details-page.component.html',
  styleUrls: ['./commande-details-page.component.scss']
})
export class CommandeDetailsPageComponent extends BaseComponentClass implements OnInit {
  loading = false
  commande: any = null

  constructor() { super() }

  ngOnInit(): void {
    this.loadCommande()
  }

  loadCommande() {
    this.loading = true
    setTimeout(() => {
      this.commande = {
        id: 1,
        demandeId: 'DEM-001',
        fournisseur: 'Tech Solutions',
        date: '2026-01-20',
        statut: 'envoyee',
        lignes: [
          { designation: 'Ordinateur portable i5', quantite: 10, prixUnitaire: 250000, total: 2500000 }
        ]
      }
      this.loading = false
    }, 500)
  }

  getStatutBadge(statut: string): string {
    const map: any = { envoyee: 'bg-blue-100 text-blue-700', reçue: 'bg-yellow-100 text-yellow-700', livree: 'bg-green-100 text-green-700', annulee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
