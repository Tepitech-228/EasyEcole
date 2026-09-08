import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ReinscriptionService } from 'src/app/data/modules/inscription/services/reinscription.service';
import { OcrService } from 'src/app/data/modules/inscription/services/ocr.service';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';

interface DocumentRequis {
  code: string;
  libelle: string;
  obligatoire: boolean;
}

@Component({
  selector: 'app-reinscription-wizard-page',
  templateUrl: './reinscription-wizard-page.component.html',
  styleUrls: ['./reinscription-wizard-page.component.scss']
})
export class ReinscriptionWizardPageComponent extends BaseComponentClass implements OnInit {

  loading = false
  submitting = false
  errorMessage = ''
  successMessage = ''

  eligibilite: any = null
  sessions: any[] = []
  sessionSelectionneeId?: number

  // Étape courante : 1..5
  etape = 1

  documentsRequis: DocumentRequis[] = []
  documents: { [code: string]: File | null } = {}
  bordereau: File | null = null
  montant?: number
  referenceBancaire = ''
  modalite = '1x'

  // Résultat de la soumission
  resultat: any = null
  planifications: any[] = []

  // Informations personnelles (pré-remplissage OCR — PHASE 3 harmonisée)
  infos: {
    nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
    nationalite: string; contact: string; email: string; adresse: string;
  } = {
    nom: '', prenoms: '', dateNaissance: '', lieuNaissance: '',
    nationalite: '', contact: '', email: '', adresse: ''
  }
  ocrEnCours = false

  constructor(
    private router: Router,
    private reinscriptionService: ReinscriptionService,
    private ocrService: OcrService,
    private demandeInscriptionService: DemandeInscriptionService
  ) {
    super()
    if (!this.rolesValue.isApprenant) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.loadEligibilite()
    this.loadPlanifications()
  }

  // ---------------------------------------------------------------------------
  // Chargements
  // ---------------------------------------------------------------------------

  loadEligibilite(): void {
    this.loading = true
    this.reinscriptionService.getEligibilite().subscribe({
      next: (res: any) => {
        this.eligibilite = res
        this.documentsRequis = (res?.documentsRequis || []).filter((d: any) => d.obligatoire)
        if (res?.sessionCible) {
          this.sessionSelectionneeId = res.sessionCible.id
        } else {
          this.loadSessions()
        }
        this.loading = false
      },
      error: (err) => {
        console.error('Erreur éligibilité:', err)
        this.loading = false
        this.errorMessage = err?.error?.message || 'Impossible de charger votre éligibilité'
      }
    })
  }

  loadSessions(): void {
    this.reinscriptionService.getSessions().subscribe({
      next: (sessions: any) => {
        this.sessions = Array.isArray(sessions) ? sessions : []
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les sessions de réinscription'
      }
    })
  }

  loadPlanifications(): void {
    this.reinscriptionService.getMesPlanifications().subscribe({
      next: (res: any) => {
        this.planifications = res?.planifications || []
      },
      error: (err) => {
        console.error('Erreur chargement planifications:', err)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Navigation / étapes
  // ---------------------------------------------------------------------------

  get dejaInscrit(): boolean {
    return !!this.eligibilite?.dejaInscrit
  }

  get soldeDette(): number {
    return this.eligibilite?.soldeDette || 0
  }

  get matricule(): string {
    return this.eligibilite?.dossier?.matricule || '—'
  }

  get parcoursLabel(): string {
    return this.eligibilite?.cursus?.parcours?.titre || '—'
  }

  get niveauLabel(): string {
    const n = this.eligibilite?.cursus?.niveauEtude
    return n?.libelle || n?.nom || '—'
  }

  get classeLabel(): string {
    const c = this.eligibilite?.cursus?.classe
    return c?.libelle || c?.nom || '—'
  }

  get anneeLabel(): string {
    return this.eligibilite?.cursus?.anneeAcademique?.libelle || '—'
  }

  get sessionCible(): any {
    return this.eligibilite?.sessionCible || null
  }

  get sessionSelectionnee(): any {
    if (this.sessionCible) return this.sessionCible
    return this.sessions.find((s) => String(s.id) === String(this.sessionSelectionneeId))
  }

  largeurProgression(): number {
    return Math.round((this.etape / 5) * 100)
  }

  passerEtape2(): void {
    this.etape = 2
  }

  versPremiereInscription(): void {
    this.router.navigate(['/inscription/choisir-session'])
  }

  get documentsComplets(): boolean {
    return this.documentsRequis.every((d) => !!this.documents[d.code])
  }

  get bordereauPret(): boolean {
    return !!this.bordereau
  }

  surDocument(code: string, event: any): void {
    const file: File = event?.target?.files?.[0]
    if (file) this.documents[code] = file
  }

  surBordereau(event: any): void {
    const file: File = event?.target?.files?.[0]
    if (file) this.bordereau = file
  }

  nomDocument(code: string): string {
    return this.documents[code]?.name || ''
  }

  allonsRecapitulatif(): void {
    this.errorMessage = ''
    if (!this.documentsComplets) {
      this.errorMessage = 'Veuillez fournir les 6 documents obligatoires.'
      return
    }
    if (!this.bordereauPret) {
      this.errorMessage = 'Veuillez téléverser le bordereau de paiement.'
      return
    }
    if (!this.sessionSelectionnee) {
      this.errorMessage = 'Veuillez sélectionner une session cible.'
      return
    }
    this.etape = 4
  }

  // ---------------------------------------------------------------------------
  // PHASE 3 harmonisée — pré-remplissage OCR des informations personnelles
  // ---------------------------------------------------------------------------

  preRemplirInfos(): void {
    if (this.ocrEnCours) return
    this.ocrEnCours = true
    // Pièces disponibles au moment de la réinscription (documents déjà déposés).
    const fichiers: File[] = Object.values(this.documents).filter((f): f is File => !!f)
    this.ocrService.preRemplissage(fichiers).subscribe({
      next: (res: any) => {
        this.ocrEnCours = false
        const d = res?.data || {}
        if (d.nom) this.infos.nom = d.nom
        if (d.prenoms) this.infos.prenoms = d.prenoms
        if (d.dateNaissance) this.infos.dateNaissance = d.dateNaissance
        if (d.lieuNaissance) this.infos.lieuNaissance = d.lieuNaissance
        if (d.nationalite) this.infos.nationalite = d.nationalite
        if (d.contact) this.infos.contact = d.contact
        if (d.email) this.infos.email = d.email
        if (d.adresse) this.infos.adresse = d.adresse
      },
      error: () => {
        this.ocrEnCours = false
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Soumission
  // ---------------------------------------------------------------------------

  soumettre(): void {
    if (this.submitting) return
    const session = this.sessionSelectionnee
    if (!session) {
      this.errorMessage = 'Session cible introuvable.'
      return
    }

    const formData = new FormData()
    // 6 documents obligatoires
    for (const d of this.documentsRequis) {
      const file = this.documents[d.code]
      if (file) formData.append(d.code, file, file.name)
    }
    // bordereau de paiement
    if (this.bordereau) formData.append('bordereau', this.bordereau, this.bordereau.name)
    // metadata
    formData.append('sessionId', String(session.id))
    if (this.montant) formData.append('montant', String(this.montant))
    if (this.referenceBancaire) formData.append('referenceBancaire', this.referenceBancaire)
    formData.append('modalite', this.modalite)

    this.submitting = true
    this.errorMessage = ''
    this.reinscriptionService.soumettre(formData).subscribe({
      next: (res: any) => {
        this.submitting = false
        this.resultat = res
        this.successMessage = res?.message || 'Dossier de réinscription soumis avec succès.'
        this.etape = 5
        this.loadPlanifications()
      },
      error: (err) => {
        this.submitting = false
        if (err?.status === 409 || /déjà en cours/i.test(err?.error?.message || err?.statusText || '')) {
          this.demandeInscriptionService.getAll().subscribe({
            next: (res: any) => {
              const existing = res?.data?.find((d: any) =>
                d.typeDemande === 'reinscription' && String(d.sessionId) === String(session?.id) &&
                ['soumis', 'authentifie', 'saisie_validee', 'transmis_comite'].includes(d.statutPipeline)
              )
              if (existing) {
                this.resultat = { statutPipeline: existing.statutPipeline }
                this.successMessage = 'Une demande de réinscription est déjà en cours pour cette session. Vous pouvez suivre son avancement.'
                this.etape = 5
                this.loadPlanifications()
              } else {
                this.errorMessage = err?.error?.message || 'Erreur lors de la soumission du dossier.'
              }
            },
            error: () => {
              this.errorMessage = err?.error?.message || 'Erreur lors de la soumission du dossier.'
            }
          })
        } else {
          this.errorMessage = err?.error?.message || 'Erreur lors de la soumission du dossier.'
        }
      }
    })
  }

  recommencer(): void {
    this.etape = 1
    this.resultat = null
    this.documents = {}
    this.bordereau = null
    this.montant = undefined
    this.referenceBancaire = ''
    this.modalite = '1x'
    this.errorMessage = ''
    this.successMessage = ''
    this.loadEligibilite()
  }

  // ---------------------------------------------------------------------------
  // Helpers d'affichage
  // ---------------------------------------------------------------------------

  formatMontant(n: number): string {
    return `${(n || 0).toLocaleString('fr-FR')} FCFA`
  }

  getStatutReinscriptionLabel(statut?: string | null): string {
    switch (statut) {
      case 'confirme': return 'Confirmée'
      case 'abandon': return 'Abandonnée'
      case 'desactive': return 'Désactivée'
      default: return 'En attente de validation'
    }
  }

  getStatutReinscriptionColor(statut?: string | null): string {
    switch (statut) {
      case 'confirme': return 'green'
      case 'abandon': return 'red'
      case 'desactive': return 'gray'
      default: return 'yellow'
    }
  }

  // Timeline pipeline
  statutsPipeline(): Array<{ key: string; label: string; active: boolean; done: boolean; kind: string }> {
    const statut = this.resultat?.statutPipeline || 'soumis'
    const steps = [
      { key: 'soumis', label: 'Soumis' },
      { key: 'authentifie', label: 'Authentifié (cabinet)' },
      { key: 'transmis_comite', label: 'Transmis au comité' },
      { key: 'valide', label: 'Validé' }
    ]
    const idx = steps.findIndex(s => s.key === statut || (statut === 'correction_demandee' && s.key === 'valide') || (statut === 'rejete' && s.key === 'valide'))
    const currentIdx = idx === -1 ? (['correction_demandee', 'rejete'].includes(statut) ? steps.length - 1 : 0) : idx
    return steps.map((s, i) => ({
      key: s.key,
      label: s.label,
      active: i === currentIdx,
      done: i < currentIdx,
      kind: statut === 'correction_demandee' && i === currentIdx ? 'warning' : (statut === 'rejete' && i === currentIdx ? 'danger' : 'ok')
    }))
  }
}
