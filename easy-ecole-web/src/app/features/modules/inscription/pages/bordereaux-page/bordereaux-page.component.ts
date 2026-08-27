import { Component, OnInit } from '@angular/core';
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

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

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

  getBordereauUrl(bordereau: Bordereau): SafeResourceUrl {
    // On passe par l'endpoint /bordereaux/:id/download : le backend résout le
    // fichier quelle que soit son arborescence (nouvelle structure dossier
    // étudiant public/dossiers/... ou ancien dépôt plat), via le champ
    // bordereau.fichier stocké en base. On ne concatène plus le chemin
    // stocké dans l'URL (ce qui provoquait une 404 « Ressource non trouvée »).
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = `${this.BORDEREAUX_PATH}${bordereau.id}/download`
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
