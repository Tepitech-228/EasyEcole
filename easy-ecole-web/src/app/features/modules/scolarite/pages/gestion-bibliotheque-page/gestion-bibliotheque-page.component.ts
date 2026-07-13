import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BibliothequeService, Livre } from 'src/app/data/modules/scolarite/services/bibliotheque.service';

@Component({
  selector: 'app-gestion-bibliotheque-page',
  templateUrl: './gestion-bibliotheque-page.component.html',
  styleUrls: ['./gestion-bibliotheque-page.component.scss']
})
export class GestionBibliothequePageComponent extends BaseComponentClass implements OnInit {
  livres: Livre[] = []
  loading: boolean = true
  showUploadModal: boolean = false
  uploading: boolean = false
  selectedFile: File | null = null
  error: string = ''
  success: string = ''

  uploadForm: FormGroup = new FormGroup({
    titre: new FormControl('', [Validators.required]),
    auteur: new FormControl('', [Validators.required]),
    description: new FormControl(''),
  })

  constructor(private bibliothequeService: BibliothequeService) {
    super()
  }

  ngOnInit(): void {
    this.loadLivres()
  }

  loadLivres(): void {
    this.loading = true
    this.bibliothequeService.getAll().subscribe({
      next: (res) => {
        this.livres = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        this.error = 'Seuls les fichiers PDF sont acceptés'
        setTimeout(() => this.error = '', 4000)
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        this.error = 'Le fichier ne doit pas dépasser 50 Mo'
        setTimeout(() => this.error = '', 4000)
        return
      }
      this.selectedFile = file
    }
  }

  uploadLivre(): void {
    this.uploadForm.markAllAsTouched()
    if (this.uploadForm.invalid || !this.selectedFile) return

    this.uploading = true
    const formData = new FormData()
    formData.append('fichier', this.selectedFile)
    formData.append('titre', this.uploadForm.get('titre')!.value)
    formData.append('auteur', this.uploadForm.get('auteur')!.value)
    formData.append('description', this.uploadForm.get('description')!.value || '')

    this.bibliothequeService.upload(formData).subscribe({
      next: () => {
        this.uploading = false
        this.closeUploadModal()
        this.loadLivres()
        this.success = 'Livre ajouté avec succès'
        setTimeout(() => this.success = '', 4000)
      },
      error: (err) => {
        this.uploading = false
        this.error = err.error?.message || 'Erreur lors de l\'upload'
        setTimeout(() => this.error = '', 4000)
      }
    })
  }

  supprimerLivre(livre: Livre): void {
    if (!confirm(`Supprimer "${livre.titre}" ?`)) return
    this.bibliothequeService.delete(livre.id).subscribe({
      next: () => {
        this.loadLivres()
        this.success = 'Livre supprimé'
        setTimeout(() => this.success = '', 4000)
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la suppression'
        setTimeout(() => this.error = '', 4000)
      }
    })
  }

  openUploadModal(): void {
    this.uploadForm.reset()
    this.selectedFile = null
    this.showUploadModal = true
  }

  closeUploadModal(): void {
    this.showUploadModal = false
    this.uploadForm.reset()
    this.selectedFile = null
  }
}
