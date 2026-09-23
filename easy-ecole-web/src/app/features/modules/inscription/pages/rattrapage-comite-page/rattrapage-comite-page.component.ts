import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageWorkflowService } from 'src/app/data/modules/inscription/services/rattrapage-workflow.service';
import { RattrapageInscriptionWorkflow, Quorum, VoteComite, MembreComite } from 'src/app/data/modules/inscription/models/RattrapageWorkflow.model';

const QUORUM_VIDE: Quorum = {
  totalMembres: 0, votesCount: 0, valides: 0, restants: 0,
  aVote: false, estUnanime: false, estRejete: false
}

type FiltreComite = 'en_attente' | 'valide' | 'rejete' | 'correction_demandee';

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

  // Détail / modal
  demandeSelectionnee?: RattrapageInscriptionWorkflow
  detailComplet?: RattrapageInscriptionWorkflow
  membres: MembreComite[] = []
  showDetailModal: boolean = false
  loadingDetail: boolean = false

  // Décision en cours
  decisionEnCours: 'valide' | 'correction_demandee' | 'rejete' | null = null
  motifDecision: string = ''
  processingDecision: boolean = false

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
      next: (res) => {
        this.demandes = res?.data || []
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

  get nbCorrectionDemandee(): number {
    return this.demandes.filter((d) => d.statutDemande === 'correction_demandee').length
  }

  // ---------------------------------------------------------------------------
  // Helpers Quorum collégial
  // ---------------------------------------------------------------------------

  getQuorum(d?: RattrapageInscriptionWorkflow | null): Quorum {
    return ((d ?? this.detailComplet)?.quorum) || QUORUM_VIDE
  }

  getQuorumLabel(d?: RattrapageInscriptionWorkflow | null): string {
    const q = this.getQuorum(d)
    if (q.totalMembres === 0) return '---'
    if (q.estUnanime) return `Unanimité (${q.valides}/${q.totalMembres})`
    if (q.estRejete) return `Rejeté (${q.votesCount}/${q.totalMembres})`
    return `${q.votesCount}/${q.totalMembres} votés — reste ${q.restants}`
  }

  getQuorumBadgeClass(d?: RattrapageInscriptionWorkflow | null): string {
    const q = this.getQuorum(d)
    if (q.estUnanime) return 'bg-green-100 text-green-800'
    if (q.estRejete) return 'bg-red-100 text-red-800'
    return 'bg-orange-100 text-orange-800'
  }

  getMembreVoteBadge(m: MembreComite | null): { label: string; cls: string } {
    if (!m?.vote) return { label: 'En attente', cls: 'bg-gray-100 text-gray-600' }
    switch (m.vote?.decision) {
      case 'valide': return { label: 'Valide', cls: 'bg-green-100 text-green-800' }
      case 'rejete': return { label: 'Rejeté', cls: 'bg-red-100 text-red-800' }
      case 'correction_demandee': return { label: 'Correction', cls: 'bg-orange-100 text-orange-800' }
      default: return { label: 'En attente', cls: 'bg-gray-100 text-gray-600' }
    }
  }

  aDejaVote(): boolean {
    return this.getQuorum(this.detailComplet).aVote
  }

  peutVoter(): boolean {
    const q = this.getQuorum(this.detailComplet)
    return !q.estUnanime && !q.estRejete
  }

  messageEtatQuorum(): string {
    const q = this.getQuorum(this.detailComplet)
    if (q.estRejete) return 'Dossier rejeté (veto)'
    if (q.estUnanime) return 'Unanimité atteinte'
    return `En attente de ${q.restants} vote(s)`
  }

  getQuorumProgressClass(): string {
    const q = this.getQuorum(this.detailComplet)
    if (q.totalMembres === 0) return 'bg-gray-200'
    const pct = Math.round((q.valides / q.totalMembres) * 100)
    if (q.estUnanime) return 'bg-green-500'
    if (q.estRejete) return 'bg-red-500'
    return pct >= 50 ? 'bg-orange-500' : 'bg-gray-400'
  }

  getValiderTooltip(): string {
    const q = this.getQuorum(this.detailComplet)
    if (q.estRejete) return 'Dossier déjà rejeté'
    if (this.aDejaVote()) return 'Vous avez déjà voté'
    if (!q.estUnanime) {
      return `Votre vote "valide" sera enregistré. Finalisation à l'unanimité — encore ${q.restants} vote(s) manquant(s)`
    }
    return ''
  }

  // ---------------------------------------------------------------------------
  // Modale détail
  // ---------------------------------------------------------------------------

  ouvrirDetail(d: RattrapageInscriptionWorkflow): void {
    this.demandeSelectionnee = d
    this.detailComplet = undefined
    this.showDetailModal = true
    this.loadingDetail = true
    this.membres = []
    this.rattrapageWorkflowService.getDemande(d.id!).subscribe({
      next: (res) => {
        this.detailComplet = res.demande
        this.membres = res.membres || []
        this.loadingDetail = false
      },
      error: () => { this.loadingDetail = false }
    })
  }

  fermerDetail(): void {
    this.showDetailModal = false
    this.demandeSelectionnee = undefined
    this.detailComplet = undefined
    this.membres = []
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  // ---------------------------------------------------------------------------
  // Décisions (3 options)
  // ---------------------------------------------------------------------------

  preparerDecision(decision: 'valide' | 'correction_demandee' | 'rejete'): void {
    this.decisionEnCours = decision
    this.motifDecision = ''
  }

  annulerDecision(): void {
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  confirmerDecision(): void {
    if (!this.demandeSelectionnee?.id || !this.decisionEnCours) return
    if (this.decisionEnCours !== 'valide' && !this.motifDecision.trim()) return

    this.processingDecision = true
    const serviceCall = this.decisionEnCours === 'valide'
      ? this.rattrapageWorkflowService.validerDemande(this.demandeSelectionnee.id!)
      : this.rattrapageWorkflowService.rejeterDemande(this.demandeSelectionnee.id!, this.motifDecision.trim())
    serviceCall.subscribe({
      next: (res) => {
        this.processingDecision = false
        this.successMessage = this.decisionEnCours === 'valide'
          ? 'Demande validée par le comité.'
          : `Décision enregistrée (« ${this.libelleDecision(this.decisionEnCours)} ») et notifiée à l'étudiant.`
        this.fermerDetail()
        this.loadDemandes()
        setTimeout(() => this.successMessage = '', 5000)
      },
      error: (err) => {
        console.error('Erreur décision:', err)
        this.errorMessage = err?.error?.message || 'Erreur lors de l\'enregistrement de la décision'
        this.processingDecision = false
        setTimeout(() => { this.errorMessage = '' }, 5000)
      }
    })
  }

  libelleDecision(d: string | null | undefined): string {
    const map: any = {
      'valide': 'Validée',
      'correction_demandee': 'Correction demandée',
      'rejete': 'Rejetée',
    }
    return map[d || ''] || (d || '---')
  }

  // ---------------------------------------------------------------------------
  // Modal validation (ancienne interface rapide)
  // ---------------------------------------------------------------------------

  openValidationModal(demande: RattrapageInscriptionWorkflow): void {
    this.demandeSelectionnee = demande
    this.showDetailModal = true
    this.preparerDecision('valide')
  }

  closeValidationModal(): void {
    this.showDetailModal = false
    this.demandeSelectionnee = undefined
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  validerDemande(): void {
    if (!this.demandeSelectionnee?.id) return
    this.preparerDecision('valide')
  }

  // ---------------------------------------------------------------------------
  // Modal rejet (ancienne interface rapide)
  // ---------------------------------------------------------------------------

  openRejetModal(demande: RattrapageInscriptionWorkflow): void {
    this.demandeSelectionnee = demande
    this.motifDecision = ''
    this.decisionEnCours = 'rejete'
    this.showDetailModal = true
  }

  closeRejetModal(): void {
    this.showDetailModal = false
    this.demandeSelectionnee = undefined
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  get rejetPossible(): boolean {
    return this.motifDecision.trim().length > 0
  }

  rejeterDemande(): void {
    if (!this.demandeSelectionnee?.id || !this.rejetPossible) return
    this.confirmerDecision()
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
      case 'correction_demandee': return 'orange'
      default: return 'yellow'
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'valide': return 'Validée'
      case 'rejete': return 'Rejetée'
      case 'correction_demandee': return 'Correction demandée'
      default: return 'En attente'
    }
  }
}
