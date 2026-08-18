import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CommandeService } from 'src/app/data/modules/achats/services/commande.service';
import { Commande } from 'src/app/data/modules/achats/models/achats.models';

@Component({
  selector: 'app-commande-details-page',
  templateUrl: './commande-details-page.component.html',
  styleUrls: ['./commande-details-page.component.scss']
})
export class CommandeDetailsPageComponent extends BaseComponentClass implements OnInit {
  loading = false
  commande: any = null

  constructor(
    private route: ActivatedRoute,
    private commandeService: CommandeService
  ) { super() }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadCommande(params['id'])
      }
    })
  }

  loadCommande(id: number | string) {
    this.loading = true
    this.commandeService.get(id).subscribe({
      next: (c: Commande) => {
        const lignes = (c.lignesCommande || []).map(l => ({
          designation: l.designation,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          total: (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0),
        }))
        this.commande = {
          id: c.id,
          demandeId: c.demandeId ? 'DEM-' + c.demandeId : '—',
          fournisseur: c.fournisseur?.nom || c.fournisseurId || '—',
          date: c.dateCommande,
          statut: c.statut,
          lignes,
        }
        this.loading = false
      },
      error: () => {
        this.commande = null
        this.loading = false
      }
    })
  }

  getStatutBadge(statut: string): string {
    const map: any = { en_cours: 'bg-blue-100 text-blue-700', envoyee: 'bg-blue-100 text-blue-700', reçue: 'bg-yellow-100 text-yellow-700', partielle: 'bg-yellow-100 text-yellow-700', livree: 'bg-green-100 text-green-700', annulee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
