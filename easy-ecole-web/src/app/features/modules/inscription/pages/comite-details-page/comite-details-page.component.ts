import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { PreInscriptionService } from 'src/app/data/modules/inscription/services/pre-inscription.service';
import { EtatPreInscription } from 'src/app/data/modules/inscription/models/PreInscription.model';

@Component({
  selector: 'app-comite-details-page',
  templateUrl: './comite-details-page.component.html',
  styleUrls: ['./comite-details-page.component.scss']
})
export class ComiteDetailsPageComponent extends BaseComponentClass implements OnInit {

  demande?: DemandeInscription
  showReponseModal: boolean = false
  commentaireReponse?: string
  actionEnCours: 'valider' | 'rejeter' = 'valider'

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private preInscriptionService: PreInscriptionService) {
    super()
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadDemande(params['id'])
      }
    })
  }

  private loadDemande(id: string): void {
    this.preInscriptionService.getDemandeDetails(id)
      .subscribe({
        next: (res) => {
          this.demande = res
        },
        error: (err) => console.log(err)
      })
  }

  getEtatBadgeClass(statut?: EtatPreInscription): string {
    switch (statut) {
      case EtatPreInscription.VALIDE: return 'bg-green-100 text-green-800'
      case EtatPreInscription.REJETE: return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  getEtatLabel(statut?: EtatPreInscription): string {
    switch (statut) {
      case EtatPreInscription.VALIDE: return 'Validée'
      case EtatPreInscription.REJETE: return 'Rejetée'
      default: return 'En attente'
    }
  }

  getStatutBadgeClass(statut?: string): string {
    switch (statut) {
      case 'valide': return 'bg-green-100 text-green-800'
      case 'en_attente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  ouvrirModalValider(): void {
    this.actionEnCours = 'valider'
    this.commentaireReponse = undefined
    this.showReponseModal = true
  }

  ouvrirModalRejeter(): void {
    this.actionEnCours = 'rejeter'
    this.commentaireReponse = undefined
    this.showReponseModal = true
  }

  fermerModal(): void {
    this.showReponseModal = false
    this.commentaireReponse = undefined
  }

  confirmerAction(): void {
    if (!this.demande || !this.demande.id) return

    const demandeId = this.demande.id
    const commentaire = this.commentaireReponse

    if (this.actionEnCours == 'valider') {
      this.preInscriptionService.valider(demandeId, commentaire)
        .subscribe({
          next: () => {
            this.fermerModal()
            this.loadDemande(this.demande!.id!)
          },
          error: (err) => console.log(err)
        })
    } else {
      this.preInscriptionService.rejeter(demandeId, commentaire || '')
        .subscribe({
          next: () => {
            this.fermerModal()
            this.loadDemande(this.demande!.id!)
          },
          error: (err) => console.log(err)
        })
    }
  }

  retour(): void {
    this.router.navigate(['/inscription/comite-orientation'])
  }

  protected readonly EtatPreInscription = EtatPreInscription
}
