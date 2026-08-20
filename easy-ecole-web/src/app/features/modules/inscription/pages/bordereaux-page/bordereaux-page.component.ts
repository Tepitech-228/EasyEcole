import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bordereaux-page',
  templateUrl: './bordereaux-page.component.html',
  styleUrls: ['./bordereaux-page.component.scss']
})
export class BordereauxPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false

  showUploadBordereauModal: boolean = false
  showDetailsBordereauModal: boolean = false
  showPdfModal: boolean = false

  bordereaux: Bordereau[] = []
  selectedBordereau?: Bordereau
  selectedFile?: File
  pdfBordereau?: Bordereau

  searchTerm = ''
  selectedStatus = ''

  readonly statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'valide', label: 'Validé' },
    { value: 'rejete', label: 'Rejeté' },
    { value: 'en_attente', label: 'En attente' }
  ]

  /** Modalités de paiement de la scolarité proposées à l'étudiant lors du dépôt du bordereau. */
  readonly modaliteOptions: { value: '1x' | '3x' | '10x'; label: string; badge: string; mensualites: number }[] = [
    { value: '1x', label: 'Paiement en 1 fois', badge: '1x', mensualites: 1 },
    { value: '3x', label: '3 mensualités', badge: '3x', mensualites: 3 },
    { value: '10x', label: '10 mensualités', badge: '10x', mensualites: 10 }
  ]

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  bordereauForm: FormGroup = new FormGroup({
    referenceBancaire: new FormControl(null, []),
    modalite: new FormControl('1x', [Validators.required]),
  })

  get selectedModalite(): '1x' | '3x' | '10x' {
    return (this.bordereauForm.get('modalite')?.value as '1x' | '3x' | '10x') || '1x'
  }

  /** Nombre de mensualités de la modalité choisie (1, 3 ou 10) — confirme le choix à l'étudiant. */
  get nombreMensualites(): number {
    return this.modaliteOptions.find(option => option.value === this.selectedModalite)?.mensualites ?? 1
  }

  constructor(
    private bordereauService: BordereauService,
    private sanitizer: DomSanitizer,
    private localStorage: LocalStorageService
  ) {
    super()
    this.getBordereaux()
  }

  ngOnInit(): void {
  }

  getBordereaux(): void {
    this.bordereauService.getAll().subscribe({
      next: (res: any) => {
        this.bordereaux = res.data || res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  get filteredBordereaux(): Bordereau[] {
    return this.bordereaux.filter(bordereau => {
      const matchesSearch = this.searchTerm
        ? [
            bordereau.type,
            bordereau.referenceBancaire,
            bordereau.statut,
            bordereau.fichier
          ]
            .filter(Boolean)
            .some(value => value?.toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true

      const matchesStatus = this.selectedStatus ? bordereau.statut === this.selectedStatus : true

      return matchesSearch && matchesStatus
    })
  }

  applyFilters(): void {
    // trigger Angular change detection via getters
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    this.selectedFile = input?.files?.[0] ?? undefined
  }

  uploadBordereau(): void {
    if (this.selectedFile) {
      const formData = new FormData()
      formData.append('referenceBancaire', this.bordereauForm.get('referenceBancaire')!.value ?? '')
      formData.append('modalite', this.selectedModalite)
      formData.append('fichier', this.selectedFile)

      this.bordereauService.upload(formData).subscribe({
        next: () => {
          this.getBordereaux()
          this.closeUploadBordereauModal()
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  isImageFile(fichier: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fichier)
  }

  getDocUrl(fichier: string): SafeResourceUrl {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = this.BORDEREAUX_PATH + fichier
    if (token) {
      url += `?token=${encodeURIComponent(token)}`
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  openPdfModal(bordereau: Bordereau): void {
    this.pdfBordereau = bordereau
    this.showPdfModal = true
  }

  closePdfModal(): void {
    this.showPdfModal = false
    this.pdfBordereau = undefined
  }

  // Modals
  closeUploadBordereauModal(): void {
    this.showUploadBordereauModal = false
    this.bordereauForm.reset({ referenceBancaire: null, modalite: '1x' })
    this.selectedFile = undefined
  }

  openDetailsBordereauModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.showDetailsBordereauModal = true
  }

  closeDetailsBordereauModal(): void {
    this.showDetailsBordereauModal = false
    this.selectedBordereau = undefined
  }
}
