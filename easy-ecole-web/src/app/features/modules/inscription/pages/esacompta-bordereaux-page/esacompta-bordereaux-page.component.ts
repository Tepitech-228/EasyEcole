import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-esacompta-bordereaux-page',
  templateUrl: './esacompta-bordereaux-page.component.html',
  styleUrls: ['./esacompta-bordereaux-page.component.scss']
})
export class EsacomptaBordereauxPageComponent extends BaseComponentClass implements OnInit {
  bordereaux: Bordereau[] = []
  typesOperations: TypeOperationBordereau[] = []
  annees: AnneeAcademique[] = []
  niveaux: NiveauEtude[] = []
  parcoursList: Parcours[] = []
  sessions: any[] = []

  loading: boolean = true
  dataLoaded: boolean = false

  selectedBordereau?: Bordereau
  showSaisieModal: boolean = false
  showPreviewModal: boolean = false

  previewResult: any = null
  error: boolean = false
  apiErrorMessage: string = ''
  avertissements: string[] = []

  selectedAnneeId: string = ''
  selectedNiveauId: string = ''
  selectedParcoursId: string = ''
  selectedTypeOperationId: string = ''

  niveauxFiltres: NiveauEtude[] = []
  parcoursFiltres: Parcours[] = []

  saisieForm: FormGroup

  // Répartition auto-calculée quand le type d'opération sélectionné est MIXTE
  composition = { inscription: null as number | null, scolarite: null as number | null }
  compositionPreviewResult: any = null
  compositionLoading: boolean = false
  bourseInfo: any = null

  /** Type d'opération actuellement sélectionné dans le formulaire de saisie */
  get typeSelectionne(): TypeOperationBordereau | undefined {
    const id = this.saisieForm.get('typeOperationId')?.value
    return this.typesOperations.find(t => String(t.id) === String(id))
  }

  /** Le type choisi est-il MIXTE ? (répartition par nature exigée) */
  get estTypeMixte(): boolean {
    return String((this.typeSelectionne as any)?.code || '').toUpperCase() === 'MIXTE'
  }

  /** Montant de la composition auto-calculée (somme inscription + scolarité) */
  get compositionSomme(): number {
    if (this.compositionPreviewResult?.composition) {
      return Math.round((this.compositionPreviewResult.composition.inscription + this.compositionPreviewResult.composition.scolarite) * 100) / 100
    }
    return 0
  }

  readonly BORDEREAUX_PATH: string = (window as any).__env?.MEDIAS_PATH?.INSCRIPTION?.BORDEREAUX || '/media/inscription/bordereaux/'

  searchTerm: string = ''

  readonly columns: DossierColumn[] = [
    { key: 'etudiant', label: 'Étudiant' },
    { key: 'matricule', label: 'Matricule', width: '130px' },
    { key: 'typeOperation', label: 'Type' },
    { key: 'montantBordereau', label: 'Montant', width: '150px' },
    { key: 'date', label: 'Date dépôt', width: '150px' },
  ]

  readonly itemActions: BatchAction[] = [
    { label: 'Traitement', color: 'green', action: 'traitement', icon: 'fact_check' },
    { label: 'Voir imputation', color: 'blue', action: 'voir-imputation', icon: 'account_tree' },
  ]

  constructor(
    private bordereauService: BordereauService,
    private typeService: TypeOperationBordereauService,
    private anneeService: AnneeAcademiqueService,
    private niveauService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private fb: FormBuilder,
    private localStorage: LocalStorageService,
    private sanitizer: DomSanitizer
  ) {
    super()
    this.saisieForm = this.fb.group({
      montantPaiement: [null, [Validators.required, Validators.min(1)]],
      referenceBancaire: [''],
      numeroBordereau: [''],
      moyenPaiement: [''],
      banque: [''],
      typeOperationId: ['', Validators.required],
      datePaiement: [''],
      commentaire: ['']
    })
  }

  readonly moyensPaiementOptions: { value: string; label: string }[] = [
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'especes', label: 'Espèces' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Chèque' }
  ]

  readonly banquesOptions: { value: string; label: string }[] = [
    { value: 'ecobank', label: 'ECOBANK' },
    { value: 'ib_bank', label: 'IB BANK' },
    { value: 'orabank', label: 'ORABANK' }
  ]

  ngOnInit(): void {
    this.loadData()
    this.loadSelects()
  }

  private loadData(): void {
    this.loading = true
    const params: any = { page: 1, limit: 50 }
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId
    if (this.selectedTypeOperationId) params.typeOperationId = this.selectedTypeOperationId

    this.bordereauService.getAImputer(params).subscribe({
      next: (res: any) => {
        this.bordereaux = res.data || res
        this.loading = false
        this.dataLoaded = true
      },
      error: () => { this.loading = false; this.dataLoaded = true }
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

  // ── Vue dossier-view (design effectifs) ──

  get bordereauxFiltres(): Bordereau[] {
    const q = this.searchTerm.toLowerCase().trim()
    if (!q) return this.bordereaux
    return this.bordereaux.filter(b => {
      const etudiant = `${b.utilisateur?.nom ?? ''} ${b.utilisateur?.prenoms ?? ''}`.toLowerCase()
      const matricule = (b.echeance?.dossierEtudiant?.matricule || '').toLowerCase()
      return etudiant.includes(q) || matricule.includes(q)
    })
  }

  get treeNodes(): DossierNode[] {
    const groupes: { [key: string]: any[] } = {}
    for (const b of this.bordereauxFiltres) {
      const cle = this.getTypeOperationLibelle(b.typeOperationId ?? null)
      ;(groupes[cle] = groupes[cle] || []).push(b)
    }
    return Object.entries(groupes).map(([type, liste]) => ({
      type: 'item' as const,
      label: type,
      expanded: true,
      items: liste.map(b => this.bordereauToItem(b)),
    }))
  }

  private bordereauToItem(b: Bordereau): any {
    return {
      id: b.id,
      raw: b,
      etudiant: b.utilisateur ? `${b.utilisateur.nom} ${b.utilisateur.prenoms}` : '—',
      matricule: b.echeance?.dossierEtudiant?.matricule || '—',
      typeOperation: this.getTypeOperationLibelle(b.typeOperationId ?? null),
      montantBordereau: this.formatCurrency(b.montant),
      date: b.dateSoumission ? new Date(b.dateSoumission) : null,
    }
  }

  onItemAction(event: { item: any, action: string }): void {
    const b = event.item?.raw as Bordereau
    if (!b) return
    if (event.action === 'traitement') this.openSaisieModal(b)
    else if (event.action === 'voir-imputation') this.openImputationPreview(b)
  }

  openSaisieModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.composition = { inscription: null, scolarite: null }
    this.compositionPreviewResult = null
    this.compositionLoading = false
    this.bourseInfo = null
    this.saisieForm.reset({
      montantPaiement: bordereau.montant || null,
      referenceBancaire: bordereau.referenceBancaire || '',
      numeroBordereau: bordereau.numeroBordereau || '',
      moyenPaiement: bordereau.moyenPaiement || '',
      banque: (bordereau as any).banque || '',
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

  closeSaisieModal(): void {
    this.showSaisieModal = false
    this.selectedBordereau = undefined
    this.error = false
    this.apiErrorMessage = ''
    this.compositionPreviewResult = null
    this.bourseInfo = null
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
        let msg = 'Erreur lors du calcul de l\'imputation'
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
    this.error = false
    this.apiErrorMessage = ''
    const typeApercu = this.estTypeMixte ? '' : (this.typeSelectionne?.code || '').toLowerCase()
    this.bordereauService.imputationPreview(bordereau.id, montant, typeApercu).subscribe({
      next: (res: any) => {
        this.previewResult = res.preview || res
        this.showPreviewModal = true
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Erreur lors du calcul de l\'imputation'
        this.apiErrorMessage = message
        this.error = true
        console.error('[ESA-COMPTA] Erreur aperçu imputation:', message, '| status:', err?.status)
      }
    })
  }

  onConfirmerSaisie(): void {
    if (this.saisieForm.invalid || !this.selectedBordereau) return
    this.error = false
    this.apiErrorMessage = ''

    // Pour les types MIXTE, on n'envoie plus de composition manuelle :
    // le backend calcule automatiquement (inscription d'abord, reste scolarité).
    const raw = this.saisieForm.value
    const payload: any = {
      montantPaiement: raw.montantPaiement,
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
        this.closeSaisieModal()
        this.showPreviewModal = false
        this.loadData()
      },
      error: (err) => {
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
    return `${environment.API_MODULES.INSCRIPTION}/bordereaux/${bordereau.id}/download`
  }

  /**
   * URL sécurisée pour les contextes "resource URL" (iframe, embed, object).
   * Angular exige une valeur de confiance explicite (DomSanitizer), sinon
   * l'erreur "unsafe value used in a resource URL context" est levée.
   */
  getDocUrlSafe(bordereau: Bordereau): SafeResourceUrl {
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

  getStatutLabel(statut: string): string {
    const map: any = { 'en_attente': 'En attente', 'valide': 'Validé', 'rejete': 'Rejeté', 'en_saisie_comptable': 'En saisie', 'traite': 'Traité' }
    return map[statut] || statut
  }
}
