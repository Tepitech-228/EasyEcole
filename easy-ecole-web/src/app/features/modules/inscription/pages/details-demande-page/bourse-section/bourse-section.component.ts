import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bourse-section',
  templateUrl: './bourse-section.component.html',
  styleUrls: ['./bourse-section.component.scss']
})
export class BourseSectionComponent implements OnInit {

  @Input() demande!: DemandeInscription
  @Input() rolesValue!: RolesValueType
  @Output() nextStep: EventEmitter<void> = new EventEmitter()
  @Output() demandeUpdated: EventEmitter<DemandeInscription> = new EventEmitter()

  estBoursier: boolean = false
  fichierSelectionne: File | null = null
  uploading: boolean = false
  uploadProgress: number = 0
  error: boolean = false
  errorMessage: string = ''

  readonly DOSSIERS_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.DOSSIERS

  constructor(private demandeInscriptionService: DemandeInscriptionService) {}

  ngOnInit(): void {
    this.estBoursier = this.demande.estBoursier === true
  }

  onToggle(value: boolean): void {
    this.estBoursier = value
    this.error = false
    this.errorMessage = ''
    // Si l'étudiant revient sur "Non", on efface le fichier sélectionné
    if (!value) {
      this.fichierSelectionne = null
    }
  }

  choisirFichier(): void {
    const input: HTMLInputElement = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf,.pdf'
    input.multiple = false

    input.onchange = _ => {
      if (input.files && input.files.length > 0) {
        const file = input.files[0]
        const estPdf = file.type === 'application/pdf'
          || file.type === 'application/x-pdf'
          || file.type === ''
          || file.type === 'application/octet-stream'
        if (!estPdf || !file.name.toLowerCase().endsWith('.pdf')) {
          alert('Le justificatif de bourse doit être un fichier PDF.')
          return
        }
        if (file.size > 20 * 1024 * 1024) {
          alert('Le fichier dépasse la taille maximale de 20 Mo.')
          return
        }
        this.fichierSelectionne = file
      }
    }

    input.click()
  }

  retirerFichier(): void {
    this.fichierSelectionne = null
  }

  valider(): void {
    this.uploading = true
    this.uploadProgress = 0
    this.error = false
    this.errorMessage = ''

    this.demandeInscriptionService.updateStatutBoursier(
      this.demande.id!,
      this.estBoursier,
      this.fichierSelectionne
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((event.loaded / event.total) * 100)
        } else if (event.type === HttpEventType.Response) {
          this.uploading = false
          this.uploadProgress = 100
          this.demandeUpdated.emit(event.body ?? undefined)
        }
      },
      error: (err) => {
        console.error(err)
        this.error = true
        this.uploading = false
        this.errorMessage = err?.error?.message
          || err?.message
          || "Une erreur est survenue lors de l'enregistrement."
      }
    })
  }

  continuer(): void {
    if (this.estBoursier && !this.demande.documentBourse && !this.fichierSelectionne) {
      this.error = true
      this.errorMessage = 'Veuillez joindre votre justificatif de bourse.'
      return
    }
    this.valider()
  }

  /** Les institutions et admin peuvent aussi consulter ce qui a été soumis */
  estVisible(): boolean {
    return this.rolesValue.isApprenant || this.rolesValue.isInstitution || this.rolesValue.isAdmin
  }
}
