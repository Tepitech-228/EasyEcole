import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  showPdfModal: boolean = false

  previewResult: any = null
  error: boolean = false
  apiErrorMessage: string = ''

  selectedAnneeId: string = ''
  selectedNiveauId: string = ''
  selectedParcoursId: string = ''
  selectedTypeOperationId: string = ''

  niveauxFiltres: NiveauEtude[] = []
  parcoursFiltres: Parcours[] = []

  saisieForm: FormGroup

  readonly BORDEREAUX_PATH: string = (window as any).__env?.MEDIAS_PATH?.INSCRIPTION?.BORDEREAUX || '/media/inscription/bordereaux/'

  constructor(
    private bordereauService: BordereauService,
    private typeService: TypeOperationBordereauService,
    private anneeService: AnneeAcademiqueService,
    private niveauService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private fb: FormBuilder,
    private localStorage: LocalStorageService
  ) {
    super()
    this.saisieForm = this.fb.group({
      montantPaiement: [null, [Validators.required, Validators.min(1)]],
      referenceBancaire: [''],
      typeOperationId: ['', Validators.required],
      datePaiement: [''],
      commentaire: ['']
    })
  }

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
  }

  openSaisieModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.saisieForm.reset({
      montantPaiement: bordereau.montant || null,
      referenceBancaire: bordereau.referenceBancaire || '',
      typeOperationId: bordereau.typeOperationId || '',
      datePaiement: bordereau.datePaiement ? new Date(bordereau.datePaiement).toISOString().split('T')[0] : '',
      commentaire: bordereau.commentaire || ''
    })
    this.showSaisieModal = true
  }

  closeSaisieModal(): void {
    this.showSaisieModal = false
    this.selectedBordereau = undefined
    this.error = false
    this.apiErrorMessage = ''
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
        console.error('Erreur preview:', err)
        this.apiErrorMessage = err?.error?.message || 'Erreur lors du calcul de l\'imputation'
        this.error = true
      }
    })
  }

  onConfirmerSaisie(): void {
    if (this.saisieForm.invalid || !this.selectedBordereau) return
    this.error = false
    this.apiErrorMessage = ''

    const payload = this.saisieForm.value
    this.bordereauService.saisir(this.selectedBordereau.id!, payload).subscribe({
      next: () => {
        this.closeSaisieModal()
        this.showPreviewModal = false
        this.loadData()
      },
      error: (err) => {
        console.error('Erreur saisie:', err)
        this.apiErrorMessage = err?.error?.message || 'Erreur lors de la saisie comptable'
        this.error = true
      }
    })
  }

  closePreviewModal(): void {
    this.showPreviewModal = false
    this.previewResult = null
  }

  openPdfModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.showPdfModal = true
  }

  closePdfModal(): void {
    this.showPdfModal = false
    this.selectedBordereau = undefined
  }

  isImageFile(fichier: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fichier)
  }

  getDocUrl(fichier: string): string {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = this.BORDEREAUX_PATH + fichier
    if (token) {
      url += `?token=${encodeURIComponent(token)}`
    }
    return url
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
