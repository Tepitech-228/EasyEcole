import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ReceptionService } from 'src/app/data/modules/achats/services/reception.service';
import { Reception, getQuantiteRecue } from 'src/app/data/modules/achats/models/achats.models';

@Component({
  selector: 'app-receptions-page',
  templateUrl: './receptions-page.component.html',
  styleUrls: ['./receptions-page.component.scss']
})
export class ReceptionsPageComponent extends BaseComponentClass implements OnInit {
  receptions: any[] = []
  loading = false
  searchTerm = ''

  constructor(private receptionService: ReceptionService) { super() }

  ngOnInit(): void {
    this.loadReceptions()
  }

  loadReceptions() {
    this.loading = true
    this.receptionService.getAll().subscribe({
      next: (items: Reception[]) => {
        this.receptions = items.map(r => ({
          id: r.id,
          commandeId: r.commande ? 'CMD-' + r.commande.id : ('CMD-' + r.commandeId),
          fournisseur: r.commande?.fournisseur?.nom || r.commande?.fournisseurId || '—',
          date: r.date,
          quantiteRecue: getQuantiteRecue(r),
          // Le backend expose les statuts "totale" / "partielle"
          statut: r.statut === 'totale' ? 'reçue' : r.statut,
        }))
        this.loading = false
      },
      error: () => {
        this.receptions = []
        this.loading = false
      }
    })
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'reçue': 'bg-green-100 text-green-700', 'partielle': 'bg-yellow-100 text-yellow-700', 'en_attente': 'bg-gray-100 text-gray-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }

  getReceptionsByStatut(statut: string): number {
    return this.receptions.filter(r => r.statut === statut).length
  }
}
