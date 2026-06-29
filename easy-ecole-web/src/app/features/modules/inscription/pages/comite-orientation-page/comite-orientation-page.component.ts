import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { PreInscriptionService } from 'src/app/data/modules/inscription/services/pre-inscription.service';
import { EtatPreInscription } from 'src/app/data/modules/inscription/models/PreInscription.model';

@Component({
  selector: 'app-comite-orientation-page',
  templateUrl: './comite-orientation-page.component.html',
  styleUrls: ['./comite-orientation-page.component.scss']
})
export class ComiteOrientationPageComponent extends BaseComponentClass implements OnInit {

  demandes: DemandeInscription[] = []
  filteredDemandes: DemandeInscription[] = []
  showReponseModal: boolean = false
  selectedDemande?: DemandeInscription
  commentaireReponse?: string
  actionEnCours: 'valider' | 'rejeter' = 'valider'

  filtreTexte: string = ''
  filtreStatut: string = 'en_attente'
  filtreParcours: string = ''
  parcoursDisponibles: string[] = []

  constructor(
    private router: Router,
    private preInscriptionService: PreInscriptionService) {
    super()
  }

  ngOnInit(): void {
    this.getDemandes()
  }

  getDemandes(): void {
    this.preInscriptionService.getAllDemandes()
      .subscribe({
        next: (res) => {
          this.demandes = res
          this.extraireParcours()
          this.appliquerFiltres()
        },
        error: (err) => console.log(err)
      })
  }

  private extraireParcours(): void {
    const titres = new Set<string>()
    for (const d of this.demandes) {
      if (d.parcoursChoisis) {
        for (const pc of d.parcoursChoisis) {
          if (pc.parcours?.titre) {
            titres.add(pc.parcours.titre)
          }
        }
      }
    }
    this.parcoursDisponibles = Array.from(titres).sort()
  }

  appliquerFiltres(): void {
    let resultats = [...this.demandes]

    if (this.filtreTexte.trim()) {
      const terme = this.filtreTexte.toLowerCase().trim()
      resultats = resultats.filter(d =>
        (d.utilisateur?.nom?.toLowerCase().includes(terme)) ||
        (d.utilisateur?.prenoms?.toLowerCase().includes(terme)) ||
        (d.matricule?.toLowerCase().includes(terme)) ||
        (d.utilisateur?.identifiant?.toLowerCase().includes(terme))
      )
    }

    if (this.filtreStatut) {
      resultats = resultats.filter(d => {
        const statut = d.preInscription?.statut
        if (this.filtreStatut == 'en_attente') return !statut || statut == 'en_attente'
        if (this.filtreStatut == 'valide') return statut == 'valide'
        if (this.filtreStatut == 'rejete') return statut == 'rejete'
        return true
      })
    }

    if (this.filtreParcours) {
      resultats = resultats.filter(d =>
        d.parcoursChoisis?.some(pc => pc.parcours?.titre == this.filtreParcours)
      )
    }

    this.filteredDemandes = resultats
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

  voirDetails(id?: string): void {
    if (id) {
      this.router.navigate(['/inscription/comite-orientation', id])
    }
  }

  ouvrirModalValider(demande: DemandeInscription): void {
    this.selectedDemande = demande
    this.actionEnCours = 'valider'
    this.commentaireReponse = undefined
    this.showReponseModal = true
  }

  ouvrirModalRejeter(demande: DemandeInscription): void {
    this.selectedDemande = demande
    this.actionEnCours = 'rejeter'
    this.commentaireReponse = undefined
    this.showReponseModal = true
  }

  fermerModal(): void {
    this.showReponseModal = false
    this.selectedDemande = undefined
    this.commentaireReponse = undefined
  }

  confirmerAction(): void {
    if (!this.selectedDemande || !this.selectedDemande.id) return

    const demandeId = this.selectedDemande.id
    const commentaire = this.commentaireReponse

    if (this.actionEnCours == 'valider') {
      this.preInscriptionService.valider(demandeId, commentaire)
        .subscribe({
          next: () => {
            this.fermerModal()
            this.getDemandes()
          },
          error: (err) => console.log(err)
        })
    } else {
      this.preInscriptionService.rejeter(demandeId, commentaire || '')
        .subscribe({
          next: () => {
            this.fermerModal()
            this.getDemandes()
          },
          error: (err) => console.log(err)
        })
    }
  }
}
