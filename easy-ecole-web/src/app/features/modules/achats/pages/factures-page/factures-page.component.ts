import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-factures-page',
  templateUrl: './factures-page.component.html',
  styleUrls: ['./factures-page.component.scss']
})
export class FacturesPageComponent extends BaseComponentClass implements OnInit {
  factures: any[] = []
  loading = false
  searchTerm = ''

  constructor() { super() }

  ngOnInit(): void {
    this.loadFactures()
  }

  loadFactures() {
    this.loading = true
    setTimeout(() => {
      this.factures = [
        { id: 1, reference: 'FAC-2026-001', fournisseur: 'Tech Solutions', montant: 2500000, dateEmission: '2026-01-25', statut: 'payee' },
        { id: 2, reference: 'FAC-2026-002', fournisseur: 'Bureau Express', montant: 150000, dateEmission: '2026-01-28', statut: 'en_attente' },
      ]
      this.loading = false
    }, 500)
  }

  get totalMontant(): number {
    return this.factures.reduce((s, f) => s + (f.montant || 0), 0)
  }

  get enAttenteCount(): number {
    return this.factures.filter(f => f.statut === 'en_attente').length
  }

  getStatutBadge(statut: string): string {
    const map: any = { payee: 'bg-green-100 text-green-700', en_attente: 'bg-yellow-100 text-yellow-700', rejetee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
