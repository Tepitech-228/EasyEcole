import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-receptions-page',
  templateUrl: './receptions-page.component.html',
  styleUrls: ['./receptions-page.component.scss']
})
export class ReceptionsPageComponent extends BaseComponentClass implements OnInit {
  receptions: any[] = []
  loading = false
  searchTerm = ''

  constructor() { super() }

  ngOnInit(): void {
    this.loadReceptions()
  }

  loadReceptions() {
    this.loading = true
    setTimeout(() => {
      this.receptions = [
        { id: 1, commandeId: 'CMD-001', fournisseur: 'Tech Solutions', date: '2026-01-25', statut: 'reçue', quantiteRecue: 100 },
        { id: 2, commandeId: 'CMD-002', fournisseur: 'Bureau Express', date: '2026-01-28', statut: 'partielle', quantiteRecue: 50 },
      ]
      this.loading = false
    }, 500)
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'reçue': 'bg-green-100 text-green-700', 'partielle': 'bg-yellow-100 text-yellow-700', 'en_attente': 'bg-gray-100 text-gray-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }

  getReceptionsByStatut(statut: string): number {
    return this.receptions.filter(r => r.statut === statut).length
  }
}
