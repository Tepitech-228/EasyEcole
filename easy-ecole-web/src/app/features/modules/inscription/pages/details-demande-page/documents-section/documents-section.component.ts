import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionDossier } from 'src/app/data/modules/inscription/models/DemandeInscriptionDossier.model';
import { DossierInscription } from 'src/app/data/modules/inscription/models/DossierInscription.model';
import { DossierInscriptionService } from 'src/app/data/modules/inscription/services/dossier-inscription.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';
import { environment } from 'src/environments/environment';

const MAX_TOTAL_SIZE = 3 * 1024 * 1024 * 1024; // 3 Go

@Component({
  selector: 'app-documents-section',
  templateUrl: './documents-section.component.html',
  styleUrls: ['./documents-section.component.scss']
})
export class DocumentsSectionComponent implements OnInit {

  error: boolean = false
  errorMessage: string = ''
  uploading: boolean = false
  uploadProgress: number = 0

  @Input() demande!: DemandeInscription
  @Input() rolesValue!: RolesValueType
  @Output() nextStep: EventEmitter<any> = new EventEmitter()

  dossiersInscription: { [id: string]: File[] } = {}

  showDossierModal: boolean = false
  selectedDossier?: DossierInscription
  selectedDossierDemande?: DemandeInscriptionDossier

  readonly DOSSIERS_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.DOSSIERS

  constructor(private dossierInscriptionService: DossierInscriptionService) { }

  ngOnInit(): void {
    console.log(this.demande)
  }

  checkDossier(dossierId: string): boolean {
    return this.demande.dossiersDemande!.find(value => value.dossierId == dossierId) != undefined
  }

  getFileCount(dossierId: string): number {
    return (this.dossiersInscription[dossierId] || []).length
  }

  get hasSelectedFiles(): boolean {
    return Object.keys(this.dossiersInscription).length > 0
  }

  choisirFichier(dossierId: string): void {
    let input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = "application/pdf,.pdf"
    input.multiple = false

    input.onchange = _ => {
      if (input.files && input.files.length > 0) {
        const files = Array.from(input.files);
        // Vérifie la taille totale
        let totalSize = 0;
        const existing = this.dossiersInscription[dossierId] || [];
        for (let f of [...existing, ...files]) totalSize += f.size;
        if (totalSize > MAX_TOTAL_SIZE) {
          alert('La taille totale des fichiers dépasse 3 Go. Veuillez sélectionner des fichiers plus petits.');
          return;
        }
        // Vérifie que c'est bien un PDF (extension OU MIME, car certains navigateurs
        // renvoient un type MIME vide pour les PDF sélectionnés)
        for (let f of files) {
          const estPdf = f.type === 'application/pdf'
            || f.type === 'application/x-pdf'
            || f.type === ''
            || f.type === 'application/octet-stream';
          if (!estPdf || !f.name.toLowerCase().endsWith('.pdf')) {
            alert(`"${f.name}" n'est pas un fichier PDF valide.`);
            return;
          }
        }
        // Un seul fichier par dossier requis → remplace toute sélection précédente
        this.dossiersInscription[dossierId] = [...files];
      }
    };

    input.click();
  }

  retirerFichier(dossierId: string, index: number): void {
    const arr = this.dossiersInscription[dossierId] || [];
    arr.splice(index, 1);
    if (arr.length === 0) {
      delete this.dossiersInscription[dossierId];
    }
  }

  validerDossiersInscription(): void {
    this.uploading = true;
    this.uploadProgress = 0;
    this.error = false;
    this.errorMessage = '';
    const dossierIds = Object.keys(this.dossiersInscription);
    let completed = 0;
    const total = dossierIds.reduce((sum, id) => sum + (this.dossiersInscription[id]?.length || 0), 0);

    for (let dossierId of dossierIds) {
      const fichiers = this.dossiersInscription[dossierId];
      if (!fichiers || fichiers.length === 0) continue;

      this.dossierInscriptionService.uploadMultiple(this.demande!.id!, dossierId, fichiers)
        .subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              this.uploadProgress = Math.round((event.loaded / event.total) * 100);
            } else if (event.type === HttpEventType.Response) {
              completed += fichiers.length;
              this.uploadProgress = Math.round((completed / total) * 100);
              if (completed >= total) {
                this.uploading = false;
                this.uploadProgress = 100;
                this.dossiersInscription = {};
                this.demande = event.body;
              }
            }
          },
          error: (err) => {
            console.error(err);
            this.error = true;
            this.uploading = false;
            this.errorMessage = err?.error?.message
              || err?.message
              || "Une erreur est survenue lors de l'upload. Vérifiez que vos fichiers sont des PDF de moins de 20 Mo.";
          }
        });
    }
  }

  // Modals
  openDossierModal(dossier: DossierInscription): void {
    this.showDossierModal = true
    this.selectedDossier = dossier
    this.selectedDossierDemande = this.demande!.dossiersDemande?.find(value => value.dossierId == dossier.id!)
  }

  closeDossierModal(): void {
    this.showDossierModal = false
    this.selectedDossier = undefined
    this.selectedDossierDemande = undefined
  }
}