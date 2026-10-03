import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { ComiteValidationService, DossierComite, FiltresComite, Quorum } from 'src/app/data/modules/inscription/services/comite-validation.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { Subscription, forkJoin, of, Subject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/** Valeurs de la colonne Parcours.type, alignées sur le backend. */
const FILIERES = ['LICENCE', 'MASTER', 'DOCTORAT', 'BTS', 'MBA']

const QUORUM_VIDE: Quorum = {
  totalMembres: 0, votesCount: 0, valides: 0, restants: 0,
  aVote: false, estUnanime: false, estRejete: false
}

@Component({
  selector: 'app-comite-validation-page',
  templateUrl: './comite-validation-page.component.html',
  styleUrls: ['./comite-validation-page.component.scss']
})
export class ComiteValidationPageComponent extends BaseComponentClass implements OnInit, OnDestroy {

  dossiers: DossierComite[] = []
  loading: boolean = true
  error: boolean = false
  apiErrorMessage: string = ''

  afficherTous: boolean = false

  selectedDossier: DossierComite | null = null
  detailComplet: DossierComite | null = null
  showDetailModal: boolean = false
  loadingDetail: boolean = false

  decisionEnCours: 'valide' | 'correction_demandee' | 'rejete' | null = null
  motifDecision: string = ''
  processingDecision: boolean = false
  successMessage: string = ''

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX
  /**
   * Endpoint de service des pièces justificatives (streamé par le backend).
   * La table ins_dossiers_demandes n'a pas d'id : identification par (demandeId, dossierId).
   */
  readonly DOCUMENTS_API: string = environment.apiUrl + '/inscription/documents/'

  // Modale « Dossier étudiant » (données personnelles + documents déposés)
  selectedEtudiantDossier: any = null
  documentsAReposer: number[] = []
  showEtudiantModal: boolean = false
  docPreviewUrl: SafeResourceUrl | null = null
  docPreviewIsImage: boolean = false
  docPreviewNom: string = ''
  telechargementPdf: boolean = false

  constructor(
    private comiteService: ComiteValidationService,
    private localStorage: LocalStorageService,
    private sanitizer: DomSanitizer,
    private parcoursService: ParcoursService,
    private niveauService: NiveauEtudeService,
    private anneeService: AnneeAcademiqueService
  ) {
    super()
  }

  // ── Filtres du tableau ──

  readonly FILIERES: string[] = FILIERES

  anneesAcademiques: AnneeAcademique[] = []
  niveauxEtude: NiveauEtude[] = []
  listeParcours: Parcours[] = []
  filtres: FiltresComite = { anneeId: '', filiere: '', parcoursId: '', niveauId: '' }
  metaTotal: number | null = null
  listeTronquee: boolean = false
  referentielsCharges: boolean = false

  /** Émet à chaque changement de filtre ; switchMap ne garde que la dernière réponse. */
  private readonly changementFiltres: Subject<void> = new Subject<void>()
  private readonly abonnements: Subscription[] = []

  get nbFiltresActifs(): number {
    return Object.values(this.filtres).filter(v => !!v).length
  }

  /** Parcours proposés, restreints à la filière sélectionnée. */
  get parcoursDisponibles(): Parcours[] {
    if (!this.filtres.filiere) return this.listeParcours
    return this.listeParcours.filter(p => p.type === this.filtres.filiere)
  }

  /**
   * Niveaux proposés. Restreints à ceux des parcours visibles, sauf si un
   * parcours est sélectionné : on ne propose alors que son propre niveau.
   */
  get niveauxDisponibles(): NiveauEtude[] {
    const parcours = this.filtres.parcoursId
      ? this.parcoursDisponibles.filter(p => String(p.id) === String(this.filtres.parcoursId))
      : this.parcoursDisponibles

    const idsNiveaux = new Set<string>()
    for (const p of parcours) {
      if (p.niveauEtudeId) idsNiveaux.add(String(p.niveauEtudeId))
    }
    if (idsNiveaux.size === 0) return this.niveauxEtude
    return this.niveauxEtude.filter(n => idsNiveaux.has(String(n.id)))
  }

  /**
   * Un changement de filtre parent invalide ses enfants : on les vide pour ne
   * jamais laisser une combinaison impossible (ex. un parcours de MASTER avec
   * une filière LICENSE).
   */
  surFiltreChange(critere: keyof FiltresComite, valeur: string): void {
    (this.filtres as any)[critere] = valeur || ''
    if (critere === 'filiere') {
      this.filtres.parcoursId = ''
      this.filtres.niveauId = ''
    } else if (critere === 'parcoursId') {
      this.filtres.niveauId = ''
    }
    this.changementFiltres.next()
  }

  reinitialiserFiltres(): void {
    this.filtres = { anneeId: '', filiere: '', parcoursId: '', niveauId: '' }
    this.changementFiltres.next()
  }

  private chargerReferentiels(): void {
    this.abonnements.push(
      forkJoin({
        annees: this.anneeService.getAll().pipe(catchError(() => of([] as AnneeAcademique[]))),
        niveaux: this.niveauService.getAll().pipe(catchError(() => of([] as NiveauEtude[]))),
        parcours: this.parcoursService.getAll().pipe(catchError(() => of([] as Parcours[])))
      }).subscribe({
        next: (r) => {
          this.anneesAcademiques = r.annees || []
          this.niveauxEtude = r.niveaux || []
          this.listeParcours = r.parcours || []
          this.referentielsCharges = true
        }
      })
    )
  }

  ngOnInit(): void {
    this.chargerReferentiels()

    this.abonnements.push(
      this.changementFiltres.pipe(
        switchMap(() => {
          this.loading = true
          this.error = false
          return this.comiteService.listerDossiers(this.afficherTous, this.filtres)
        })
      ).subscribe({
        next: (res) => {
          this.dossiers = res.data || []
          this.metaTotal = res.meta?.total ?? null
          this.listeTronquee = !!res.meta?.tronque
          this.loading = false
        },
        error: (err) => {
          console.error(err)
          this.dossiers = []
          this.metaTotal = null
          this.listeTronquee = false
          this.apiErrorMessage = err?.error?.message || 'Erreur de chargement des dossiers'
          this.error = true
          this.loading = false
        }
      })
    )

    this.changementFiltres.next()
  }

  ngOnDestroy(): void {
    this.changementFiltres.complete()
    this.abonnements.forEach(s => s.unsubscribe())
  }

  /** Recharge la liste en conservant les filtres actifs (toggle « afficher tous »). */
  charger(): void {
    this.changementFiltres.next()
  }

  getParcoursFinal(d: any): string {
    const pFinal = d?.parcoursChoisis?.find((pc: any) => pc.choixFinal === true || pc.choixFinal === 1 || pc.choixFinal === '1')
    const p = pFinal || d?.parcoursChoisis?.[0]
    return p?.parcours ? `${p.parcours.titre || ''} (${p.parcours.type || ''})` : '---'
  }

  getAnnee(d: any): string {
    return d?.session?.anneeAcademique?.libelle || '---'
  }

  nbDocuments(d: any): number {
    return d?.dossiersDemande?.length ?? 0
  }

  totalBordereaux(d: any): string {
    const montants = (d?.bordereaux || [])
      .filter((b: any) => b.statut === 'traite' && b.montant)
      .map((b: any) => Number(b.montant))
    if (!montants.length) return '---'
    return new Intl.NumberFormat('fr-FR').format(montants.reduce((a: number, b: number) => a + b, 0)) + ' FCFA'
  }

  ouvrirDetail(d: DossierComite): void {
    this.selectedDossier = d
    this.detailComplet = null
    this.showDetailModal = true
    this.loadingDetail = true
    if (d.id === undefined) return
    this.comiteService.detailDossier(d.id).subscribe({
      next: (res) => { this.detailComplet = res.data; this.loadingDetail = false },
      error: () => { this.loadingDetail = false }
    })
  }

  // ── Helpers Quorum collégial ──

  getQuorum(d?: DossierComite | null): Quorum {
    return ((d ?? this.detailComplet)?.quorum) || QUORUM_VIDE
  }

  getQuorumLabel(d?: DossierComite | null): string {
    const q = this.getQuorum(d)
    if (q.totalMembres === 0) return '---'
    if (q.estUnanime) return `Unanimité (${q.valides}/${q.totalMembres})`
    if (q.estRejete) return `Rejeté (${q.votesCount}/${q.totalMembres})`
    return `${q.votesCount}/${q.totalMembres} votés — reste ${q.restants}`
  }

  getQuorumBadgeClass(d?: DossierComite | null): string {
    const q = this.getQuorum(d)
    if (q.estUnanime) return 'bg-green-100 text-green-800'
    if (q.estRejete) return 'bg-red-100 text-red-800'
    return 'bg-orange-100 text-orange-800'
  }

  getMembreVoteBadge(m: any): { label: string; cls: string } {
    if (!m?.vote) return { label: 'En attente', cls: 'bg-gray-100 text-gray-600' }
    switch (m.vote.decision) {
      case 'valide': return { label: 'Valide', cls: 'bg-green-100 text-green-800' }
      case 'rejete': return { label: 'Rejeté', cls: 'bg-red-100 text-red-800' }
      case 'correction_demandee': return { label: 'Correction', cls: 'bg-orange-100 text-orange-800' }
      default: return { label: 'En attente', cls: 'bg-gray-100 text-gray-600' }
    }
  }

  isVoteValide(m: any): boolean {
    return m?.vote?.decision === 'valide'
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

  fermerDetail(): void {
    this.showDetailModal = false
    this.selectedDossier = null
    this.detailComplet = null
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  // ── Modale « Dossier étudiant » ──

  ouvrirDossierEtudiant(d: any): void {
    this.selectedEtudiantDossier = d
    this.documentsAReposer = (d?.dossiersDemande || [])
      .filter((doc: any) => doc.correctionDemandee)
      .map((doc: any) => Number(doc.dossierId))
    this.docPreviewUrl = null
    this.docPreviewNom = ''
    this.showEtudiantModal = true
  }

  fermerDossierEtudiant(): void {
    this.showEtudiantModal = false
    this.selectedEtudiantDossier = null
    this.docPreviewUrl = null
    this.docPreviewNom = ''
  }

  estDocumentAReposer(doc: any): boolean {
    return this.documentsAReposer.includes(Number(doc?.dossierId))
  }

  definirDocumentAReposer(doc: any, checked: boolean): void {
    const dossierId = Number(doc?.dossierId)
    if (!Number.isInteger(dossierId) || dossierId <= 0) return
    this.documentsAReposer = checked
      ? [...new Set([...this.documentsAReposer, dossierId])]
      : this.documentsAReposer.filter(id => id !== dossierId)
  }

  getDocEtudiantUrl(doc: any): string {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = `${this.DOCUMENTS_API}download?demandeId=${doc?.demandeId}&dossierId=${doc?.dossierId}`
    if (token) url += `&token=${encodeURIComponent(token)}`
    return url
  }

  voirDocument(doc: any): void {
    const fichier = doc?.nomFichier || ''
    if (!fichier) return
    this.docPreviewIsImage = this.isImageFile(fichier)
    const url = this.getDocEtudiantUrl(doc)
    this.docPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url)
    this.docPreviewNom = fichier
  }

  /**
   * Télécharge le dossier complet de l'étudiant en un seul PDF multipages,
   * réunissant les pièces déposées au wizard et les pièces financières.
   */
  telechargerDossierComplet(d: any): void {
    if (!d?.id || this.telechargementPdf) return
    this.telechargementPdf = true
    this.apiErrorMessage = ''

    this.comiteService.telechargerPdfFusionne(d.id).subscribe({
      next: (blob) => {
        this.telechargementPdf = false
        if (!blob || blob.size === 0) {
          this.apiErrorMessage = 'Aucune pièce n’a pu être rassemblée pour cet étudiant.'
          return
        }
        const url = URL.createObjectURL(blob)
        const lien = document.createElement('a')
        lien.href = url
        lien.download = `dossier_${d.matricule || d.id}.pdf`
        document.body.appendChild(lien)
        lien.click()
        document.body.removeChild(lien)
        URL.revokeObjectURL(url)
      },
      error: () => {
        this.telechargementPdf = false
        this.apiErrorMessage = 'Impossible de générer le dossier PDF de cet étudiant.'
      }
    })
  }

  preparerDecision(decision: 'valide' | 'correction_demandee' | 'rejete'): void {
    this.decisionEnCours = decision
    this.motifDecision = ''
  }

  annulerDecision(): void {
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  confirmerDecision(): void {
    if (!this.selectedDossier?.id || !this.decisionEnCours) return
    if (this.decisionEnCours !== 'valide' && !this.motifDecision.trim()) return

    this.processingDecision = true
    const dossierIdsAReposer = this.decisionEnCours === 'correction_demandee' && this.documentsAReposer.length
      ? this.documentsAReposer
      : undefined
    this.comiteService.decider(this.selectedDossier.id, this.decisionEnCours, this.motifDecision, dossierIdsAReposer).subscribe({
      next: (res) => {
        this.processingDecision = false
        const matricule = res?.data?.matricule
        this.successMessage = this.decisionEnCours === 'valide'
          ? `Inscription validée${matricule ? ' — Matricule : ' + matricule : ''}. L'étudiant a été notifié par email.`
          : `Décision enregistrée (« ${this.libelleDecision(this.decisionEnCours)} ») et notifiée à l'étudiant.`
        this.fermerDetail()
        this.charger()
        setTimeout(() => this.successMessage = '', 8000)
      },
      error: (err) => {
        console.error(err)
        this.apiErrorMessage = err?.error?.message || 'Erreur lors de l\'enregistrement de la décision'
        this.error = true
        this.processingDecision = false
        setTimeout(() => { this.error = false; this.apiErrorMessage = '' }, 6000)
      }
    })
  }

  libelleDecision(d: string | null | undefined): string {
    const map: any = {
      'valide': 'Validé',
      'correction_demandee': 'Correction demandée',
      'rejete': 'Rejeté',
      'transmis_comite': 'En attente du comité',
      'authentifie': 'Authentifié (Audit)',
      'soumis': 'Soumis'
    }
    return map[d || ''] || (d || '---')
  }

  // ── Badge 1ère inscription / Réinscription ──

  estReinscription(d: any): boolean {
    return !!d?.estReinscription || d?.typeDemande === 'reinscription'
  }

  libelleTypeDemande(d: any): string {
    return this.estReinscription(d) ? 'Réinscription' : '1ère inscription'
  }

  get pointsControleReinscription(): string[] {
    return [
      'Demande adressée au Directeur Général',
      'Autorisation provisoire d\u2019inscription',
      'Relevés de notes obtenus',
      'Carte d\u2019identité nationale',
      'Quitus définitif et bordereaux de l\u2019année écoulée',
      'Bordereau d\u2019inscription de la nouvelle année'
    ]
  }

  get pointsControlePremiere(): string[] {
    return [
      'Pièces classiques du nouvel étudiant (CNI, relevés, diplômes)',
      'Autorisation / préinscription validée',
      'Bordereau d\u2019inscription'
    ]
  }

  pointsControle(d: any): string[] {
    return this.estReinscription(d) ? this.pointsControleReinscription : this.pointsControlePremiere
  }

  getDocUrl(fichier: string): string {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = this.BORDEREAUX_PATH + fichier
    if (token) url += `?token=${encodeURIComponent(token)}`
    return url
  }

  isImageFile(fichier: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fichier || '')
  }

  formatMontant(v: any): string {
    if (v == null) return '---'
    return new Intl.NumberFormat('fr-FR').format(Number(v)) + ' FCFA'
  }
}
