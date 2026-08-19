import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageDocumentRequis, RattrapageInscriptionWorkflow, RattrapageSession } from 'src/app/data/modules/inscription/models/RattrapageWorkflow.model';
import { RattrapageWorkflowService } from 'src/app/data/modules/inscription/services/rattrapage-workflow.service';

const TAILLE_MAX_FICHIER = 20 * 1024 * 1024; // 20 Mo

@Component({
  selector: 'app-rattrapage-mes-demandes-page',
  templateUrl: './rattrapage-mes-demandes-page.component.html',
  styleUrls: ['./rattrapage-mes-demandes-page.component.scss']
})
export class RattrapageMesDemandesPageComponent extends BaseComponentClass implements OnInit {

  sessionsOuvertes: RattrapageSession[] = []
  mesDemandes: RattrapageInscriptionWorkflow[] = []

  loadingSessions: boolean = false
  loadingDemandes: boolean = false
  uploading: boolean = false
  errorMessage: string = ''
  successMessage: string = ''

  // Modal soumission de demande
  showSoumissionModal: boolean = false
  sessionSelectionnee?: RattrapageSession
  motifEtudiant: string = ''
  creneauSouhaite: string = ''

  constructor(
    private router: Router,
    private rattrapageWorkflowService: RattrapageWorkflowService
  ) {
    super()
    if (!this.rolesValue.isApprenant) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.loadSessionsOuvertes()
    this.loadMesDemandes()
  }

  loadSessionsOuvertes(): void {
    this.loadingSessions = true
    this.rattrapageWorkflowService.getSessions().subscribe({
      next: (sessions) => {
        this.sessionsOuvertes = sessions.filter((s) => s.statut === 'ouverte')
        this.loadingSessions = false
      },
      error: (err) => {
        console.error('Erreur chargement sessions:', err)
        this.loadingSessions = false
      }
    })
  }

  loadMesDemandes(): void {
    this.loadingDemandes = true
    this.rattrapageWorkflowService.getDemandes().subscribe({
      next: (demandes) => {
        this.mesDemandes = demandes
        this.loadingDemandes = false
      },
      error: (err) => {
        console.error('Erreur chargement demandes:', err)
        this.loadingDemandes = false
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Soumission d'une demande
  // ---------------------------------------------------------------------------

  sessionDejaDemandee(sessionId?: number): boolean {
    if (!sessionId) return false
    return this.mesDemandes.some((d) => String(d.rattrapageSessionId) === String(sessionId))
  }

  openSoumissionModal(session: RattrapageSession): void {
    this.sessionSelectionnee = session
    this.motifEtudiant = ''
    this.creneauSouhaite = ''
    this.showSoumissionModal = true
  }

  closeSoumissionModal(): void {
    this.showSoumissionModal = false
    this.sessionSelectionnee = undefined
    this.motifEtudiant = ''
    this.creneauSouhaite = ''
  }

  get soumissionPossible(): boolean {
    return this.motifEtudiant.trim().length > 0
  }

  soumettreDemande(): void {
    if (!this.sessionSelectionnee?.id || !this.soumissionPossible) return

    this.uploading = true
    this.errorMessage = ''

    this.rattrapageWorkflowService.createDemande({
      rattrapageSessionId: this.sessionSelectionnee.id,
      motifEtudiant: this.motifEtudiant.trim(),
      creneauSouhaite: this.creneauSouhaite.trim() || undefined
    }).subscribe({
      next: () => {
        this.uploading = false
        this.successMessage = 'Demande de rattrapage soumise avec succès.'
        this.closeSoumissionModal()
        setTimeout(() => { this.successMessage = '' }, 5000)
        this.loadMesDemandes()
      },
      error: (err) => {
        console.error('Erreur soumission demande:', err)
        this.uploading = false
        this.errorMessage = err?.error?.message || err?.message || 'Erreur lors de la soumission de la demande'
        setTimeout(() => { this.errorMessage = '' }, 6000)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Suivi des documents requis
  // ---------------------------------------------------------------------------

  getDocumentsRequis(demande: RattrapageInscriptionWorkflow): RattrapageDocumentRequis[] {
    return demande.documentsRequis || []
  }

  documentDejaDepose(demande: RattrapageInscriptionWorkflow, documentRequisId?: number): boolean {
    if (!documentRequisId) return false
    return (demande.documentsDeposes || []).some((d) => String(d.documentRequisId) === String(documentRequisId))
  }

  getDocumentDepose(demande: RattrapageInscriptionWorkflow, documentRequisId?: number): any {
    return (demande.documentsDeposes || []).find((d) => String(d.documentRequisId) === String(documentRequisId))
  }

  uploaderDocument(demande: RattrapageInscriptionWorkflow, documentRequisId: number): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf,.pdf'
    input.onchange = () => {
      const fichier = input.files && input.files.length > 0 ? input.files[0] : null
      if (!fichier) return

      const estPdf = fichier.type === 'application/pdf'
        || fichier.type === 'application/x-pdf'
        || fichier.type === 'application/octet-stream'
        || fichier.type === ''
      if (!estPdf || !fichier.name.toLowerCase().endsWith('.pdf')) {
        this.errorMessage = `"${fichier.name}" n'est pas un fichier PDF valide.`
        setTimeout(() => { this.errorMessage = '' }, 5000)
        return
      }
      if (fichier.size > TAILLE_MAX_FICHIER) {
        this.errorMessage = `Le fichier "${fichier.name}" dépasse la taille maximale de 20 Mo.`
        setTimeout(() => { this.errorMessage = '' }, 5000)
        return
      }
      if (!demande.id) return

      this.uploading = true
      this.errorMessage = ''
      this.rattrapageWorkflowService.uploadDocument(demande.id, documentRequisId, fichier).subscribe({
        next: () => {
          this.uploading = false
          this.successMessage = 'Pièce justificative téléversée avec succès.'
          setTimeout(() => { this.successMessage = '' }, 4000)
          this.loadMesDemandes()
        },
        error: (err) => {
          console.error('Erreur upload document:', err)
          this.uploading = false
          this.errorMessage = err?.error?.message || err?.message || 'Erreur lors du téléversement de la pièce'
          setTimeout(() => { this.errorMessage = '' }, 6000)
        }
      })
    }
    input.click()
  }

  // ---------------------------------------------------------------------------
  // Bordereau de paiement
  // ---------------------------------------------------------------------------

  peutDeposerBordereau(demande: RattrapageInscriptionWorkflow): boolean {
    return demande.statutDemande === 'valide' && demande.statutPaiement !== 'paye'
  }

  paiementConfirme(demande: RattrapageInscriptionWorkflow): boolean {
    return demande.statutPaiement === 'paye'
  }

  televerserBordereau(demande: RattrapageInscriptionWorkflow): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf,.pdf'
    input.onchange = () => {
      const fichier = input.files && input.files.length > 0 ? input.files[0] : null
      if (!fichier || !demande.id) return

      const estPdf = fichier.type === 'application/pdf'
        || fichier.type === 'application/x-pdf'
        || fichier.type === 'application/octet-stream'
        || fichier.type === ''
      if (!estPdf || !fichier.name.toLowerCase().endsWith('.pdf')) {
        this.errorMessage = `"${fichier.name}" n'est pas un fichier PDF valide.`
        setTimeout(() => { this.errorMessage = '' }, 5000)
        return
      }
      if (fichier.size > TAILLE_MAX_FICHIER) {
        this.errorMessage = `Le fichier "${fichier.name}" dépasse la taille maximale de 20 Mo.`
        setTimeout(() => { this.errorMessage = '' }, 5000)
        return
      }

      this.uploading = true
      this.errorMessage = ''
      this.rattrapageWorkflowService.uploadBordereau(demande.id, fichier).subscribe({
        next: () => {
          this.uploading = false
          this.successMessage = 'Bordereau de paiement téléversé. Il sera vérifié par la comptabilité.'
          setTimeout(() => { this.successMessage = '' }, 5000)
          this.loadMesDemandes()
        },
        error: (err) => {
          console.error('Erreur upload bordereau:', err)
          this.uploading = false
          this.errorMessage = err?.error?.message || err?.message || 'Erreur lors du téléversement du bordereau'
          setTimeout(() => { this.errorMessage = '' }, 6000)
        }
      })
    }
    input.click()
  }

  // ---------------------------------------------------------------------------
  // Helpers d'affichage
  // ---------------------------------------------------------------------------

  getStatutBadgeColor(statut?: string | null): string {
    switch (statut) {
      case 'valide': return 'green'
      case 'rejete': return 'red'
      default: return 'yellow'
    }
  }

  getStatutLabel(statut?: string | null): string {
    switch (statut) {
      case 'valide': return 'Validée par le comité'
      case 'rejete': return 'Rejetée'
      default: return 'En attente du comité'
    }
  }

  getStatutPaiementBadgeColor(statut?: string | null): string {
    return statut === 'paye' ? 'green' : 'orange'
  }

  getStatutPaiementLabel(statut?: string | null): string {
    return statut === 'paye' ? 'Payé — inscription définitive' : 'Impayé'
  }

  getMontantFormate(demande: RattrapageInscriptionWorkflow): string {
    if (demande.montant === null || demande.montant === undefined) return ''
    return `${demande.montant.toLocaleString('fr-FR')} FCFA`
  }
}