import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { TypeOperationBordereau } from 'src/app/data/modules/inscription/models/TypeOperationBordereau.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { TypeOperationBordereauService } from 'src/app/data/modules/inscription/services/type-operation-bordereau.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/core/services/toast.service';
import { Observable, of } from 'rxjs';

const montantPaiementValide = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;

  const montant = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(montant) && montant >= 1 ? null : { montantInvalide: true };
};

@Component({
  selector: 'app-esacompta-bordereaux-page',
  templateUrl: './esacompta-bordereaux-page.component.html',
  styleUrls: ['./esacompta-bordereaux-page.component.scss']
})
export class EsacomptaBordereauxPageComponent extends BaseComponentClass implements OnInit, OnDestroy {
  bordereaux: Bordereau[] = []
  recouvreurs: { id?: string | number; nom?: string; prenoms?: string }[] = []
  auditeurs: { id?: string | number; nom?: string; prenoms?: string }[] = []
  typesOperations: TypeOperationBordereau[] = []
  annees: AnneeAcademique[] = []
  niveaux: NiveauEtude[] = []
  parcoursList: Parcours[] = []
  sessions: any[] = []

  loading = true
  dataLoaded = false

  selectedBordereau?: any
  showSaisieModal = false
  showPreviewModal = false
  showMatriculeConfirmationModal = false

  previewResult: any = null
  error = false
  apiErrorMessage = ''
  avertissements: string[] = []

  selectedAnneeId = ''
  selectedNiveauId = ''
  selectedParcoursId = ''
  selectedTypeOperationId = ''
  selectedRecouvreurId = ''
  selectedAuditeurId = ''

  niveauxFiltres: NiveauEtude[] = []
  parcoursFiltres: Parcours[] = []

  saisieForm: FormGroup

  // KPI (onglet actif)
  enAttenteCount = 0

  // Répartition auto-calculée quand le type d'opération sélectionné est MIXTE
  composition = { inscription: null as number | null, scolarite: null as number | null }
  compositionPreviewResult: any = null
  compositionLoading = false
  bourseInfo: any = null

  /** SafeResourceUrl mémorisé pour le bordereau sélectionné — évite la boucle infinie
   * causée par bypassSecurityTrustResourceUrl() qui crée un nouvel objet à chaque évaluation */
  private selectedBordereauSafeUrl: SafeResourceUrl | null = null

  /** Type d'opération actuellement sélectionné dans le formulaire de saisie */
  private presenceHeartbeat?: ReturnType<typeof setInterval>
  private dataRequestId = 0
  private dataRequestInFlight = false

  get typeSelectionne(): TypeOperationBordereau | undefined {
    const id = this.saisieForm.get('typeOperationId')?.value
    return this.typesOperations.find(t => String(t.id) === String(id))
  }

  /** Le type choisi est-il MIXTE ? (répartition par nature exigée) */
  get estTypeMixte(): boolean {
    return String((this.typeSelectionne as any)?.code || '').toUpperCase() === 'MIXTE'
  }

  get matriculeEtudiantRequis(): boolean {
    const demande = this.selectedBordereau?.demandeInscription
    const statut = demande?.statutPipeline
    if (demande?.typeDemande === 'reinscription'
      || ['saisie_validee', 'transmis_comite', 'valide'].includes(statut)) {
      return false
    }
    return !!demande
      || ['inscription', 'mixte'].includes(String(this.selectedBordereau?.type || '').toLowerCase())
  }

  /** Montant de la composition auto-calculée (somme inscription + scolarité) */
  get compositionSomme(): number {
    if (this.compositionPreviewResult?.composition) {
      return Math.round((this.compositionPreviewResult.composition.inscription + this.compositionPreviewResult.composition.scolarite) * 100) / 100
    }
    return 0
  }

  readonly BORDEREAUX_PATH: string = (window as any).__env?.MEDIAS_PATH?.INSCRIPTION?.BORDEREAUX || '/media/inscription/bordereaux/'
  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  searchTerm: string = ''

  /** Statut porté par l'URL (lire dans ngOnInit) */
  activeStatut: string = ''

  /** Mapping statut URL → libellé affiché (sans dependance à statutTabs) */
  private readonly statutLabels: Record<string, string> = {
    'valide,en_saisie_comptable': 'À imputer',
    'en_attente': 'En attente',
    'traite': 'Traités',
    'rejete': 'Rejetés',
  }

  /** Titre dynamique basé sur le statut de la route */
  get titrePage(): string {
    return `Bordereaux ${this.statutLabels[this.activeStatut] || 'À imputer'}`
  }

  /** Colonnes adaptées à l'onglet actif : on ajoute « Statut » uniquement pour l'onglet mixte */
  get columns(): DossierColumn[] {
    const base: DossierColumn[] = [
      { key: 'etudiant', label: 'Étudiant' },
      { key: 'matricule', label: 'Matricule', width: '130px' },
      { key: 'typeOperation', label: 'Type' },
      { key: 'montantBordereau', label: 'Montant', width: '150px' },
      { key: 'date', label: 'Date dépôt', width: '150px' },
    ]
    if (this.activeStatut === 'valide,en_saisie_comptable') {
      return [...base, { key: 'statut', label: 'Statut', width: '120px' }]
    }
    if (this.activeStatut === 'traite') {
      return [
        ...base,
        { key: 'traiteur', label: 'Traiteur', width: '180px' },
        { key: 'auditeur', label: 'Auditeur', width: '180px' },
      ]
    }
    return base
  }

  /** Actions disponibles selon l'onglet actif */
  get itemActionsCourantes(): BatchAction[] {
    if (this.activeStatut === 'valide,en_saisie_comptable') {
      return [
        { label: 'Traitement', color: 'green', action: 'traitement', icon: 'fact_check' },
        { label: 'Libérer', color: 'gray', action: 'liberer', icon: 'lock_open' },
        { label: 'Voir état traitement', color: 'blue', action: 'voir-imputation', icon: 'account_tree' },
      ]
    }
    if (this.activeStatut === 'traite') {
      return [
        { label: 'Voir état traitement', color: 'blue', action: 'voir-imputation', icon: 'account_tree' },
      ]
    }
    return []
  }

  constructor(
    private route: ActivatedRoute,
    private bordereauService: BordereauService,
    private typeService: TypeOperationBordereauService,
    private anneeService: AnneeAcademiqueService,
    private niveauService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private fb: FormBuilder,
    private localStorage: LocalStorageService,
    private sanitizer: DomSanitizer,
    private toastService: ToastService
  ) {
    super()
    this.saisieForm = this.fb.group({
      montantPaiement: [null, [Validators.required, Validators.min(1), montantPaiementValide]],
      matriculeEtudiant: [''],
      referenceBancaire: ['', Validators.required, this.verificateurUnicite('referenceBancaire')],
      numeroBordereau: ['', Validators.required, this.verificateurUnicite('numeroBordereau')],
      moyenPaiement: [''],
      banque: [''],
      typeOperationId: ['', Validators.required],
      datePaiement: ['', Validators.required],
      commentaire: ['']
    })
  }

  private uniciteCheck: any = null

  verificateurUnicite(champ: 'referenceBancaire' | 'numeroBordereau') {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const valeur = (control.value || '').trim()
      if (!valeur) return of(null)
      if (this.uniciteCheck) clearTimeout(this.uniciteCheck)
      return new Observable<ValidationErrors | null>((subscriber) => {
        this.uniciteCheck = setTimeout(() => {
          const params: any = { [champ]: valeur }
          if (this.selectedBordereau?.id) params.excludeId = this.selectedBordereau.id
          this.bordereauService.verifierUnicite(params).subscribe({
            next: (res: any) => {
              subscriber.next(res?.unique ? null : { unicite: true })
              subscriber.complete()
            },
            error: () => {
              subscriber.next(null)
              subscriber.complete()
            }
          })
        }, 300)
      })
    }
  }

  readonly moyensPaiementOptions: { value: string; label: string }[] = [
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'especes', label: 'Espèces' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'autre', label: 'Autres' },
    { value: 'depot_banque', label: 'Dépôt en banque' }
  ]

  readonly banquesOptions: { value: string; label: string }[] = [
    { value: 'ib_bank', label: 'IB BANK' },
    { value: 'ecobank', label: 'ECOBANK' },
    { value: 'orabank', label: 'ORABANK' }
  ]

  ngOnInit(): void {
    this.activeStatut = this.route.snapshot.data['statut'] || 'valide,en_saisie_comptable'
    this.loadData()
    this.loadSelects()
    if (this.activeStatut === 'valide,en_saisie_comptable') {
      this.presenceHeartbeat = setInterval(() => this.loadData(false), 30_000)
    }
  }

  ngOnDestroy(): void {
    if (this.presenceHeartbeat) clearInterval(this.presenceHeartbeat)
    if (this.showSaisieModal && this.selectedBordereau?.id) {
      this.bordereauService.libererRecouvrement(String(this.selectedBordereau.id)).subscribe({
        error: err => console.error('Erreur libération du bordereau à la fermeture de la file:', err)
      })
    }
  }

  private calculateKPIs(): void {
    this.enAttenteCount = this.bordereaux.length
  }

  private loadData(showSpinner = true): void {
    if (!showSpinner && this.dataRequestInFlight) return
    const requestId = ++this.dataRequestId
    this.dataRequestInFlight = true
    if (showSpinner) this.loading = true
    this.error = false
    this.apiErrorMessage = ''
    const params: any = { page: 1, limit: 50, statut: this.activeStatut }
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId
    if (this.selectedTypeOperationId) params.typeOperationId = this.selectedTypeOperationId
    if (this.activeStatut === 'traite' && this.selectedRecouvreurId) {
      params.saisiParId = this.selectedRecouvreurId
    }
    if (this.activeStatut === 'traite' && this.selectedAuditeurId) {
      params.valideParId = this.selectedAuditeurId
    }

    this.bordereauService.getAImputer(params).subscribe({
      next: (res: any) => {
        if (requestId !== this.dataRequestId) return
        this.bordereaux = res.data || res
        if (Array.isArray(res.recouvreurs)) {
          this.recouvreurs = res.recouvreurs
        }
        if (Array.isArray(res.auditeurs)) {
          this.auditeurs = res.auditeurs
        }
        this.calculateKPIs()
        this.loading = false
        this.dataLoaded = true
        this.dataRequestInFlight = false
      },
      error: (err) => {
        if (requestId !== this.dataRequestId) return
        this.loading = false
        this.dataLoaded = true
        this.dataRequestInFlight = false
        this.error = true
        this.apiErrorMessage = err?.error?.message || 'Impossible de charger les bordereaux. Vérifiez vos droits puis réessayez.'
      }
    })
  }

  private loadSelects(): void {
    this.typeService.getActive().subscribe(data => this.typesOperations = data)
    this.anneeService.getAll().subscribe(data => this.annees = data)
    this.niveauService.getAll().subscribe(data => this.niveaux = data)
    this.parcoursService.getAll().subscribe(data => this.parcoursList = data)
    this.sessionService.getAll().subscribe(data => this.sessions = data)
  }

  onAnneeChange(): void {
    this.selectedNiveauId = ''
    this.selectedParcoursId = ''
    this.niveauxFiltres = []
    this.parcoursFiltres = []

    if (this.selectedAnneeId) {
      const niveauIds = new Set<string>()
      this.sessions
        .filter(s => s.anneeAcademiqueId && String(s.anneeAcademiqueId) === String(this.selectedAnneeId))
        .forEach(s => { if (s.niveauEtudeId) niveauIds.add(String(s.niveauEtudeId)) })

      this.niveauxFiltres = niveauIds.size > 0
        ? this.niveaux.filter(n => niveauIds.has(String(n.id!)))
        : this.niveaux
    }
    this.loadData()
  }

  onNiveauChange(): void {
    this.selectedParcoursId = ''
    this.parcoursFiltres = []

    if (this.selectedNiveauId) {
      this.parcoursFiltres = this.parcoursList.filter(p => String(p.niveauEtudeId) === String(this.selectedNiveauId))
    }
    this.loadData()
  }

  onParcoursChange(): void {
    this.loadData()
  }

  onTypeOperationChange(): void {
    this.loadData()
    // Si on est dans la modale et le type devient MIXTE, charger l'auto-composition
    if (this.showSaisieModal && this.selectedBordereau && this.estTypeMixte) {
      this.loadCompositionPreview()
    } else if (this.showSaisieModal && !this.estTypeMixte) {
      this.compositionPreviewResult = null
      this.bourseInfo = null
    }
  }

  onRecouvreurChange(): void {
    this.loadData()
  }

  onAuditeurChange(): void {
    this.loadData()
  }

  // ── Vue dossier-view (design effectifs) ──

  get bordereauxFiltres(): Bordereau[] {
    const q = this.searchTerm.toLowerCase().trim()
    if (!q) return this.bordereaux
    return this.bordereaux.filter(b => {
      const etudiant = `${(b as any).demandeInscription?.utilisateur?.nom ?? b.utilisateur?.nom ?? ''} ${(b as any).demandeInscription?.utilisateur?.prenoms ?? b.utilisateur?.prenoms ?? ''}`.toLowerCase()
      const matricule = (b.echeance?.dossierEtudiant?.matricule || '').toLowerCase()
      return etudiant.includes(q) || matricule.includes(q)
    })
  }

  /**
   * Arbre hiérarchique : Année académique → Niveau → Parcours → Étudiant → items(bordereaux)
   * Les libellés proviennent de la donnée embarquée dans b.demandeInscription (fallback fourni).
   */
  get treeNodes(): DossierNode[] {
    const groups: { [key: string]: any } = {}

    for (const b of this.bordereauxFiltres) {
      const di = (b as any).demandeInscription

      // Année
      const anneeLibelle: string = di?.session?.anneeAcademique?.libelle || 'Sans année'
      // Niveau
      const niveauLibelle: string = di?.session?.niveauEtude?.libelle || 'Sans niveau'
      // Parcours : chercher choixFinal === true
      const parcoursChoisis: any[] = di?.parcoursChoisis || []
      let parcoursLibelle: string = 'Sans parcours'
      if (parcoursChoisis.length > 0) {
        const choix = parcoursChoisis.find((p: any) => p.choixFinal === true)
        parcoursLibelle = choix?.parcours?.titre || parcoursChoisis[0]?.parcours?.titre || 'Sans parcours'
      }

      const anneeKey = anneeLibelle
      const niveauKey = `${anneeLibelle}||${niveauLibelle}`
      const parcoursKey = `${anneeLibelle}||${niveauLibelle}||${parcoursLibelle}`
      const etudiantLabel = b.utilisateur ? `${b.utilisateur.nom} ${b.utilisateur.prenoms}` : 'Étudiant inconnu'
      const etudiantKey = `${parcoursKey}||${etudiantLabel}`

      if (!groups[anneeKey]) groups[anneeKey] = {}
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = {}
      if (!groups[anneeKey][niveauKey][parcoursKey]) groups[anneeKey][niveauKey][parcoursKey] = {}
      if (!groups[anneeKey][niveauKey][parcoursKey][etudiantKey]) {
        groups[anneeKey][niveauKey][parcoursKey][etudiantKey] = { items: [] }
      }
      groups[anneeKey][niveauKey][parcoursKey][etudiantKey].items.push(b)
    }

    return Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: anneeKey,
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, parcs]: [string, any]) => {
        const niveauLibelle = niveauKey.split('||')[1] || niveauKey
        return {
          type: 'niveau' as const,
          label: niveauLibelle,
          expanded: true,
          children: Object.entries(parcs).map(([parcoursKey, etudiants]: [string, any]) => {
            const parcoursLibelle = parcoursKey.split('||')[2] || parcoursKey
            return {
              type: 'parcours' as const,
              label: parcoursLibelle,
              expanded: true,
              children: Object.entries(etudiants).map(([etudiantKey, group]: [string, any]) => {
                const etudiantLabel = etudiantKey.split('||').pop() || 'Étudiant inconnu'
                return {
                  type: 'etudiant' as const,
                  label: etudiantLabel,
                  expanded: true,
                  items: group.items.map(b => this.bordereauToItem(b)),
                }
              })
            }
          })
        }
      })
    }))
  }

  private bordereauToItem(b: Bordereau): any {
    const di = (b as any).demandeInscription
    return {
      id: b.id,
      raw: b,
      statut: this.getStatutLabel(b.statut || ''),
      etudiant: b.utilisateur ? `${b.utilisateur.nom} ${b.utilisateur.prenoms}` : 'Étudiant inconnu',
      matricule: b.echeance?.dossierEtudiant?.matricule || '—',
      typeOperation: this.getTypeOperationLibelle(b.typeOperationId ?? null),
      montantBordereau: this.formatCurrency(b.montant),
      date: b.dateSoumission ? new Date(b.dateSoumission) : null,
      traiteur: b.saisiPar ? `${b.saisiPar.prenoms || ''} ${b.saisiPar.nom || ''}`.trim() || '—' : '—',
      auditeur: b.validePar ? `${b.validePar.prenoms || ''} ${b.validePar.nom || ''}`.trim() || '—' : '—',
    }
  }

  onItemAction(event: { item: any, action: string }): void {
    const b = event.item?.raw as Bordereau
    if (!b) return
    if (event.action === 'traitement') this.openSaisieModal(b)
    else if (event.action === 'voir-imputation') this.openImputationPreview(b)
    else if (event.action === 'liberer' && b.id) this.libererBordereau(String(b.id))
  }

  openSaisieModal(bordereau: Bordereau): void {
    if (!bordereau.id) return
    this.bordereauService.prendreEnChargeRecouvrement(String(bordereau.id)).subscribe({
      next: () => this.initialiserSaisieModal(bordereau),
      error: (err) => {
        this.toastService.warning(err?.error?.message || "Ce bordereau n'est plus disponible. Actualisez la file.")
        this.loadData()
      }
    })
  }

  private initialiserSaisieModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.selectedBordereauSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.getDocUrl(bordereau))
    const demande = (bordereau as any).demandeInscription
    const matriculeExistant = demande?.matriculeEtudiant
      || (bordereau as any).echeance?.dossierEtudiant?.matricule
      || ''
    const matriculeControl = this.saisieForm.get('matriculeEtudiant')
    matriculeControl?.setValidators(this.matriculeEtudiantRequis
      ? [Validators.required, Validators.maxLength(64), Validators.pattern(/\S/)]
      : [])
    matriculeControl?.updateValueAndValidity({ emitEvent: false })
    this.composition = { inscription: null, scolarite: null }
    this.compositionPreviewResult = null
    this.compositionLoading = false
    this.bourseInfo = null
    this.saisieForm.reset({
      montantPaiement: bordereau.montant || null,
      matriculeEtudiant: matriculeExistant,
      referenceBancaire: bordereau.referenceBancaire || '',
      numeroBordereau: bordereau.numeroBordereau || '',
      moyenPaiement: bordereau.moyenPaiement || '',
      banque: '',
      typeOperationId: bordereau.typeOperationId || '',
      datePaiement: bordereau.datePaiement ? new Date(bordereau.datePaiement).toISOString().split('T')[0] : '',
      commentaire: bordereau.commentaire || ''
    })
    this.showSaisieModal = true
    // Auto-charger la composition si type MIXTE
    if (this.estTypeMixte) {
      this.loadCompositionPreview()
    }
    // Réagir aux changements de montant pour recharger l'auto-composition
    this.saisieForm.get('montantPaiement')?.valueChanges.subscribe(val => {
      if (this.showSaisieModal && this.estTypeMixte) {
        this.loadCompositionPreview()
      }
    })
  }

  closeSaisieModal(release = true): void {
    const bordereauId = this.selectedBordereau?.id
    if (release && this.showSaisieModal && bordereauId) {
      this.libererBordereau(String(bordereauId))
    }
    this.showSaisieModal = false
    this.showMatriculeConfirmationModal = false
    this.selectedBordereau = undefined
    this.selectedBordereauSafeUrl = null
    this.error = false
    this.apiErrorMessage = ''
    this.compositionPreviewResult = null
    this.bourseInfo = null
  }

  private libererBordereau(id: string): void {
    this.bordereauService.libererRecouvrement(id).subscribe({
      next: () => this.loadData(),
      error: (err) => {
        if (err?.status !== 409) console.error('Erreur libération du bordereau:', err)
        this.loadData()
      }
    })
  }

  /**
   * Charge la répartition auto-calculée (inscription d'abord, reste scolarité)
   * + info bourse de l'étudiant. Appelé quand le type est MIXTE.
   */
  loadCompositionPreview(): void {
    if (!this.selectedBordereau) return
    const montant = Number(this.saisieForm.get('montantPaiement')?.value || 0)
    if (!montant || montant <= 0) return

    this.compositionLoading = true
    this.bordereauService.compositionPreview(this.selectedBordereau.id!, montant).subscribe({
      next: (res: any) => {
        this.compositionPreviewResult = res
        this.bourseInfo = res.bourse || null
        // Mettre à jour les champs composition pour le payload
        this.composition.inscription = res.composition?.inscription || 0
        this.composition.scolarite = res.composition?.scolarite || 0
        this.compositionLoading = false
      },
      error: (err) => {
        console.error('Erreur composition preview:', err)
        this.compositionLoading = false
        this.compositionPreviewResult = null
      }
    })
  }

  onPreview(): void {
    if (this.saisieForm.invalid || !this.selectedBordereau) return
    this.error = false
    this.apiErrorMessage = ''

    const montant = this.saisieForm.get('montantPaiement')?.value
    this.bordereauService.imputationPreview(this.selectedBordereau.id!, montant).subscribe({
      next: (res: any) => {
        this.previewResult = res.preview || res
        this.showPreviewModal = true
      },
      error: (err) => {
        let msg = 'Erreur lors du calcul du traitement'
        try {
          if (err?.error?.message) msg = err.error.message
          else if (err?.message) msg = err.message
        } catch (_) {}
        console.error('[ESA-COMPTA] Erreur preview:', msg, '| status:', err?.status)
        this.apiErrorMessage = msg
        this.error = true
      }
    })
  }

  openImputationPreview(bordereau: Bordereau): void {
    const montant = Number(bordereau.montant || 0)
    if (!bordereau.id || !montant || montant <= 0) {
      this.apiErrorMessage = 'Le montant du bordereau est invalide ou absent.'
      this.error = true
      return
    }

    this.selectedBordereau = bordereau
    this.selectedBordereauSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.getDocUrl(bordereau))
    this.error = false
    this.apiErrorMessage = ''
    const typeApercu = this.estTypeMixte ? '' : (this.typeSelectionne?.code || '').toLowerCase()
    this.bordereauService.imputationPreview(bordereau.id, montant, typeApercu).subscribe({
      next: (res: any) => {
        this.previewResult = res.preview || res
        this.showPreviewModal = true
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Erreur lors du calcul du traitement'
        this.apiErrorMessage = message
        this.error = true
        console.error('[ESA-COMPTA] Erreur aperçu traitement:', message, '| status:', err?.status)
      }
    })
  }

  onConfirmerSaisie(): void {
    this.saisieForm.markAllAsTouched()
    if (this.saisieForm.invalid || !this.selectedBordereau) return
    this.error = false
    this.apiErrorMessage = ''

    if (this.matriculeEtudiantRequis) {
      this.showMatriculeConfirmationModal = true
      return
    }
    this.executerSaisie()
  }

  confirmerValidationMatricule(): void {
    if (!this.selectedBordereau || this.saisieForm.invalid) return
    this.showMatriculeConfirmationModal = false
    this.executerSaisie()
  }

  private executerSaisie(): void {
    if (!this.selectedBordereau) return
    const montantControl = this.saisieForm.get('montantPaiement')
    const montantPaiement = Number(montantControl?.value)
    if (!Number.isFinite(montantPaiement) || montantPaiement < 1) {
      montantControl?.setErrors({ ...(montantControl.errors || {}), montantInvalide: true })
      montantControl?.markAsTouched()
      this.apiErrorMessage = 'Saisissez un montant valide supérieur ou égal à 1.'
      this.error = true
      return
    }

    // Pour les types MIXTE, on n'envoie plus de composition manuelle :
    // le backend calcule automatiquement (inscription d'abord, reste scolarité).
    const raw = this.saisieForm.value
    const payload: any = {
      montantPaiement,
      ...(this.matriculeEtudiantRequis
        ? { matriculeEtudiant: String(raw.matriculeEtudiant || '').trim() }
        : {}),
      referenceBancaire: (raw.referenceBancaire || '').trim() || null,
      numeroBordereau: (raw.numeroBordereau || '').trim() || null,
      moyenPaiement: (raw.moyenPaiement || '').trim() || null,
      banque: (raw.banque || '').trim() || null,
      typeOperationId: raw.typeOperationId,
      datePaiement: raw.datePaiement || null,
      commentaire: (raw.commentaire || '').trim() || null,
    }

    console.log('[ESA-COMPTA] Payload saisie:', JSON.stringify(payload))

    this.bordereauService.saisir(this.selectedBordereau.id!, payload).subscribe({
      next: (res: any) => {
        console.log('[ESA-COMPTA] Saisie réussie:', res)
        // Alerte « double mixte » (non bloquante) remontée par le backend
        this.avertissements = Array.isArray(res?.avertissements) ? res.avertissements : []
        this.closeSaisieModal(false)
        this.showPreviewModal = false
        this.loadData()
      },
      error: (err) => {
        if (err?.error?.code === 'FRAIS_INSCRIPTION_INSUFFISANTS') {
          this.toastService.error("Les frais saisis ne sont pas conformes. Veuillez saisir une somme supérieure aux frais d'inscription.")
          return
        }

        // Extraire le message d'erreur depuis toutes les structures possibles
        let msg = 'Erreur lors de la saisie comptable'
        try {
          if (err?.error?.message) {
            msg = err.error.message
            if (err.error.details) {
              msg += ' — ' + JSON.stringify(err.error.details)
            }
          } else if (err?.message) {
            msg = err.message
          } else if (typeof err === 'string') {
            msg = err
          }
        } catch (_) {
          msg = `Erreur HTTP ${err?.status || 'inconnu'}`
        }

        // Cas spécifique : bordereau déjà traité → popup orange (toast warning)
        if (msg.includes('Ce bordereau est déjà traité')) {
          this.toastService.warning('Ce bordereau est déjà traité')
          return
        }

        // Log détaillé pour diagnostic
        console.error('[ESA-COMPTA] Erreur saisie:', msg)
        console.error('[ESA-COMPTA] Erreur complète:', {
          status: err?.status,
          statusText: err?.statusText,
          error: err?.error,
          message: err?.message,
          name: err?.name,
          url: err?.url,
          type: err?.constructor?.name,
          raw: err
        })
        this.apiErrorMessage = msg
        this.error = true
      }
    })
  }

  closePreviewModal(): void {
    this.showPreviewModal = false
    this.previewResult = null
  }

  isImageFile(fichier: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fichier)
  }

  getDocUrl(bordereau: Bordereau): string {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = `${environment.API_MODULES.INSCRIPTION}/bordereaux/${bordereau.id}/download`
    if (token) {
      url += `?token=${encodeURIComponent(token)}`
    }
    return url
  }

  /**
   * URL sécurisée pour les contextes "resource URL" (iframe, embed, object).
   * Angular exige une valeur de confiance explicite (DomSanitizer), sinon
   * l'erreur "unsafe value used in a resource URL context" est levée.
   * Mémoïsation : retourne le SafeResourceUrl calculé pour le selectedBordereau
   * courant sans créer de nouvel objet à chaque évaluation du template.
   */
  getDocUrlSafe(bordereau: Bordereau): SafeResourceUrl {
    if (this.selectedBordereau && this.selectedBordereau.id === bordereau.id && this.selectedBordereauSafeUrl) {
      return this.selectedBordereauSafeUrl
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getDocUrl(bordereau))
  }

  getTypeOperationLibelle(id: number | string | null | undefined): string {
    if (!id) return '---'
    const t = this.typesOperations.find(x => x.id === id)
    return t ? (t.libelle || '---') : '---'
  }

  formatCurrency(value: number | undefined | null): string {
    if (value == null) return '---'
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
  }

  /** Libellé de l'année académique depuis demandeInscription */
  getAnneeLibelle(b: any): string {
    if (!b?.demandeInscription?.session?.anneeAcademique?.libelle) return '—'
    return b.demandeInscription.session.anneeAcademique.libelle
  }

  /** Libellé du niveau d'étude depuis demandeInscription */
  getNiveauLibelle(b: any): string {
    if (!b?.demandeInscription?.session?.niveauEtude?.libelle) return '—'
    return b.demandeInscription.session.niveauEtude.libelle
  }

  /** Libellé du parcours choisi (choixFinal=true) depuis demandeInscription */
  getParcoursLibelle(b: any): string {
    if (!b?.demandeInscription?.parcoursChoisis?.length) return '—'
    const choix = b.demandeInscription.parcoursChoisis.find((p: any) => p.choixFinal === true)
    return choix?.parcours?.titre || b.demandeInscription.parcoursChoisis[0]?.parcours?.titre || '—'
  }

  /** Libellé de la filière (type du parcours) depuis demandeInscription */
  getFiliereLibelle(b: any): string {
    if (!b?.demandeInscription?.parcoursChoisis?.length) return '—'
    const choix = b.demandeInscription.parcoursChoisis.find((p: any) => p.choixFinal === true)
    if (!choix?.parcours) return '—'
    return choix.parcours.type || choix.parcours.titre || '—'
  }

  /** Période cours (matin/soir/en_ligne) depuis apprenant */
  getOptionCours(b: any): string {
    if (!b?.demandeInscription?.utilisateur?.apprenant?.periode) return '—'
    return b.demandeInscription.utilisateur.apprenant.periode
  }

  /** Traduit la période en libellé humain */
  getPeriodeLibelle(periode: string | null | undefined): string {
    if (!periode) return '—'
    const map: Record<string, string> = { matin: 'Jour', soir: 'Soir', en_ligne: 'En ligne' }
    return map[periode] || periode
  }

  getStatutLabel(statut: string): string {
    const map: any = { 'en_attente': 'En attente', 'valide': 'Validé', 'rejete': 'Rejeté', 'en_saisie_comptable': 'En saisie', 'traite': 'Traité' }
    return map[statut] || statut
  }

  /** Retourne l'URL de la photo de l'étudiant (ou l'image par défaut si absente) */
  getPhotoUrl(bordereau: any): string {
    const photo = bordereau?.utilisateur?.apprenant?.photo
      || bordereau?.demandeInscription?.utilisateur?.apprenant?.photo
    if (photo) {
      return this.PHOTOS_PATH + photo
    }
    return 'assets/images/blank-profile-picture.png'
  }
}
