import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeService } from 'src/app/data/modules/achats/services/demande.service';
import { DemandeAchat, getMontantDemande, getNomUtilisateur } from 'src/app/data/modules/achats/models/achats.models';

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

  constructor(private demandeService: DemandeService) { super() }

  ngOnInit(): void {
    this.loadDemandes()
  }

  loadDemandes() {
    this.loading = true
    this.demandeService.getAll().subscribe({
      next: (items: DemandeAchat[]) => {
        this.demandes = items.map(d => ({
          id: d.id,
          description: d.description,
          demandeur: getNomUtilisateur(d.soumisPar),
          montantEstime: getMontantDemande(d),
          statut: d.statut,
          dateSoumission: d.dateSoumission,
        }))
        this.loading = false
      },
      error: () => {
        this.demandes = []
        this.loading = false
      }
    })
  }

  get total(): number { return this.demandes.length }
  get brouillons(): number { return this.demandes.filter(d => d.statut === 'brouillon').length }
  get soumises(): number { return this.demandes.filter(d => d.statut === 'soumise').length }
  get validees(): number { return this.demandes.filter(d => d.statut === 'validee').length }

  getStatutBadge(statut: string): string {
    const map: any = { brouillon: 'bg-gray-100 text-gray-700', soumise: 'bg-yellow-100 text-yellow-700', validee: 'bg-green-100 text-green-700', rejetee: 'bg-red-100 text-red-700', commandee: 'bg-blue-100 text-blue-700', recue: 'bg-purple-100 text-purple-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
