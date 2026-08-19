import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageInscriptionWorkflow } from 'src/app/data/modules/inscription/models/RattrapageWorkflow.model';
import { RattrapageWorkflowService } from 'src/app/data/modules/inscription/services/rattrapage-workflow.service';

type FiltreComite = 'en_attente' | 'valide' | 'rejete';

@Component({
  selector: 'app-rattrapage-comite-page',
  templateUrl: './rattrapage-comite-page.component.html',
  styleUrls: ['./rattrapage-comite-page.component.scss']
})
export class RattrapageComitePageComponent extends BaseComponentClass implements OnInit {

  demandes: RattrapageInscriptionWorkflow[] = []
  loading: boolean = false
  errorMessage: string = ''
  successMessage: string = ''
  activeFiltre: FiltreComite = 'en_attente'

  // Modal rejet
  showRejetModal: boolean = false
  demandeSelectionnee?: RattrapageInscriptionWorkflow
  motifRejet: string = ''

  // Modal validation
  showValidationModal: boolean = false

  constructor(
    private router: Router,
    private rattrapageWorkflowService: RattrapageWorkflowService
  ) {
    super()
    if (!this.rolesValue.isComiteOrientation && !this.rolesValue.isAdmin && !this.rolesValue.isInstitution) {
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
        console.error('Erreur chargement demandes de rattrapage:', err)
        this.errorMessage = 'Erreur lors du chargement des demandes de rattrapage'
        this.loading = false
      }
    })
  }

  setFiltre(filtre: FiltreComite): void {
    this.activeFiltre = filtre
  }

  get filteredDemandes(): RattrapageInscriptionWorkflow[] {
    return this.demandes.filter((d) => (d.statutDemande || 'en_attente') === this.activeFiltre)
  }

  get nbEnAttente(): number {
    return this.demandes.filter((d) => (d.statutDemande || 'en_attente') === 'en_attente').length
  }

  get nbValidees(): number {
    return this.demandes.filter((d) => d.statutDemande === 'valide').length
  }

  get nbRejetees(): number {
    return this.demandes.filter((d) => d.statutDemande === 'rejete').length
  }

  // ---------------------------------------------------------------------------
  // Validation / rejet
  // ---------------------------------------------------------------------------

  openValidationModal(demande: RattrapageInscriptionWorkflow): void {
    this.demandeSelectionnee = demande
    this.showValidationModal = true
  }

  closeValidationModal(): void {
    this.showValidationModal = false
    this.demandeSelectionnee = undefined
  }

  validerDemande(): void {
    const demande = this.demandeSelectionnee
    if (!demande?.id) return

    this.rattrapageWorkflowService.validerDemande(demande.id).subscribe({
      next: () => {
        this.successMessage = 'Demande validée. L\'étudiant peut désormais déposer son bordereau de paiement.'
        this.closeValidationModal()
        setTimeout(() => { this.successMessage = '' }, 5000)
        this.loadDemandes()
      },
      error: (err) => {
        console.error('Erreur validation demande:', err)
        this.errorMessage = err?.error?.message || err?.message || 'Erreur lors de la validation de la demande'
        setTimeout(() => { this.errorMessage = '' }, 5000)
      }
    })
  }

  openRejetModal(demande: RattrapageInscriptionWorkflow): void {
    this.demandeSelectionnee = demande
    this.motifRejet = ''
    this.showRejetModal = true
  }

  closeRejetModal(): void {
    this.showRejetModal = false
    this.demandeSelectionnee = undefined
    this.motifRejet = ''
  }

  get rejetPossible(): boolean {
    return this.motifRejet.trim().length > 0
  }

  rejeterDemande(): void {
    const demande = this.demandeSelectionnee
    if (!demande?.id || !this.rejetPossible) return

    this.rattrapageWorkflowService.rejeterDemande(demande.id, this.motifRejet.trim()).subscribe({
      next: () => {
        this.successMessage = 'Demande rejetée'
        this.closeRejetModal()
        setTimeout(() => { this.successMessage = '' }, 4000)
        this.loadDemandes()
      },
      error: (err) => {
        console.error('Erreur rejet demande:', err)
        this.errorMessage = err?.error?.message || err?.message || 'Erreur lors du rejet de la demande'
        setTimeout(() => { this.errorMessage = '' }, 5000)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Téléchargement des pièces (BLOB)
  // ---------------------------------------------------------------------------

  telechargerDocument(demande: RattrapageInscriptionWorkflow, documentDeposeId: number): void {
    if (!demande.id) return
    this.rattrapageWorkflowService.telechargerDocument(demande.id, documentDeposeId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => window.URL.revokeObjectURL(url), 10000)
      },
      error: (err) => {
        console.error('Erreur téléchargement document:', err)
        this.errorMessage = err?.error?.message || 'Erreur lors du téléchargement de la pièce'
        setTimeout(() => { this.errorMessage = '' }, 5000)
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

  getDocumentsDeposesCount(demande: RattrapageInscriptionWorkflow): number {
    return (demande.documentsDeposes || []).length
  }

  getDocumentsRequisCount(demande: RattrapageInscriptionWorkflow): number {
    return (demande.documentsRequis || []).length
  }

  getStatutBadgeColor(statut?: string): string {
    switch (statut) {
      case 'valide': return 'green'
      case 'rejete': return 'red'
      default: return 'yellow'
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'valide': return 'Validée'
      case 'rejete': return 'Rejetée'
      default: return 'En attente'
    }
  }
}