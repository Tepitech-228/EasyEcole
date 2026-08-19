import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageInscriptionWorkflow } from 'src/app/data/modules/inscription/models/RattrapageWorkflow.model';
import { RattrapageWorkflowService } from 'src/app/data/modules/inscription/services/rattrapage-workflow.service';

@Component({
  selector: 'app-rattrapage-paiements-page',
  templateUrl: './rattrapage-paiements-page.component.html',
  styleUrls: ['./rattrapage-paiements-page.component.scss']
})
export class RattrapagePaiementsPageComponent extends BaseComponentClass implements OnInit {

  demandes: RattrapageInscriptionWorkflow[] = []
  loading: boolean = false
  errorMessage: string = ''
  successMessage: string = ''

  // Modal confirmation de paiement
  showConfirmationModal: boolean = false
  demandeSelectionnee?: RattrapageInscriptionWorkflow
  confirming: boolean = false

  constructor(
    private router: Router,
    private rattrapageWorkflowService: RattrapageWorkflowService
  ) {
    super()
    if (!this.rolesValue.isCabinetComptable && !this.rolesValue.isAdmin) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.loadDemandes()
  }

  loadDemandes(): void {
    this.loading = true
    this.errorMessage = ''
    this.rattrapageWorkflowService.getDemandes().subscribe({
      next: (demandes) => {
        this.demandes = demandes
        this.loading = false
      },
      error: (err) => {
        console.error('Erreur chargement demandes:', err)
        this.errorMessage = 'Erreur lors du chargement des paiements de rattrapage'
        this.loading = false
      }
    })
  }

  /** Demandes validées par le comité avec un bordereau déposé et non encore payé. */
  get demandesAPayer(): RattrapageInscriptionWorkflow[] {
    return this.demandes.filter((d) =>
      d.statutDemande === 'valide'
      && d.bordereauDepose
      && d.statutPaiement !== 'paye'
    )
  }

  /** Historique des paiements confirmés (statutPaiement 'paye'). */
  get paiementsConfirmes(): RattrapageInscriptionWorkflow[] {
    return this.demandes.filter((d) => d.statutPaiement === 'paye')
  }

  openConfirmationModal(demande: RattrapageInscriptionWorkflow): void {
    this.demandeSelectionnee = demande
    this.showConfirmationModal = true
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false
    this.demandeSelectionnee = undefined
  }

  confirmerPaiement(): void {
    const demande = this.demandeSelectionnee
    if (!demande?.id) return

    this.confirming = true
    this.errorMessage = ''
    this.rattrapageWorkflowService.confirmerPaiement(demande.id).subscribe({
      next: () => {
        this.confirming = false
        this.successMessage = 'Paiement confirmé. Étudiant inscrit aux épreuves de rattrapage.'
        this.closeConfirmationModal()
        setTimeout(() => { this.successMessage = '' }, 6000)
        this.loadDemandes()
      },
      error: (err) => {
        console.error('Erreur confirmation paiement:', err)
        this.confirming = false
        this.errorMessage = err?.error?.message || err?.message || 'Erreur lors de la confirmation du paiement'
        setTimeout(() => { this.errorMessage = '' }, 6000)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Helpers d'affichage
  // ---------------------------------------------------------------------------

  getEtudiantLabel(demande: RattrapageInscriptionWorkflow): string {
    const u = demande.utilisateur
    if (!u) return `#${demande.demandePar ?? demande.id}`
    const nom = [u.nom, u.prenoms].filter(Boolean).join(' ')
    return nom.trim() || `#${demande.demandePar ?? demande.id}`
  }

  getSessionLabel(demande: RattrapageInscriptionWorkflow): string {
    return demande.rattrapageSession?.libelle || `Session #${demande.rattrapageSessionId}`
  }

  getMontantFormate(demande: RattrapageInscriptionWorkflow): string {
    if (demande.montant === null || demande.montant === undefined) return '---'
    return `${demande.montant.toLocaleString('fr-FR')} FCFA`
  }
}