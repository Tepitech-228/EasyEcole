import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-commandes-page',
  templateUrl: './liste-commandes-page.component.html',
  styleUrls: ['./liste-commandes-page.component.scss']
})
export class ListeCommandesPageComponent extends BaseComponentClass implements OnInit {
  commandes: any[] = []
  loading = false
  searchTerm = ''

  constructor() { super() }

  ngOnInit(): void {
    this.loadCommandes()
  }

  loadCommandes() {
    this.loading = true
    setTimeout(() => {
      this.commandes = [
        { id: 1, demandeId: 'DEM-001', fournisseur: 'Tech Solutions', date: '2026-01-20', statut: 'envoyee', montant: 2500000 },
        { id: 2, demandeId: 'DEM-002', fournisseur: 'Bureau Express', date: '2026-01-22', statut: 'reçue', montant: 150000 },
      ]
      this.loading = false
    }, 500)
  }

  get totalMontant(): number {
    return this.commandes.reduce((s, c) => s + (c.montant || 0), 0)
  }

  get envoyeesCount(): number {
    return this.commandes.filter(c => c.statut === 'envoyee').length
  }

  getStatutBadge(statut: string): string {
    const map: any = { envoyee: 'bg-blue-100 text-blue-700', reçue: 'bg-yellow-100 text-yellow-700', livree: 'bg-green-100 text-green-700', annulee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
