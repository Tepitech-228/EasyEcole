import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionDossier } from 'src/app/data/modules/inscription/models/DemandeInscriptionDossier.model';
import { DossierInscription } from 'src/app/data/modules/inscription/models/DossierInscription.model';
import { DossierInscriptionService } from 'src/app/data/modules/inscription/services/dossier-inscription.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-documents-section',
  templateUrl: './documents-section.component.html',
  styleUrls: ['./documents-section.component.scss']
})
export class DocumentsSectionComponent implements OnInit {

  error: boolean = false

  @Input() demande!: DemandeInscription
  @Input() rolesValue!: RolesValueType
  @Output() nextStep: EventEmitter<any> = new EventEmitter()

  dossiersInscription: { [id: string]: File }[] = []

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

  choisirFichier(dossierId: string): void {
    let input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = "application/pdf"

    input.onchange = _ => {
      if (input.files) {
        let file: File | undefined = input.files[0]
        if (file) {
          this.dossiersInscription[dossierId] = file
        }
        console.log(Array.from(this.dossiersInscription));
      }
      else {
        console.log("Error")
      }
    };

    input.click();
  }

  validerDossiersInscription(): void {
    for (let dossierId in this.dossiersInscription) {
      let fichier: File = (Array.from([this.dossiersInscription[dossierId]]) as any[])[0] as File
      console.log(fichier)

      let demandeInscriptionDossier: DemandeInscriptionDossier = new DemandeInscriptionDossier()
      demandeInscriptionDossier.dossierId = dossierId
      demandeInscriptionDossier.demandeId = this.demande!.id

      this.dossierInscriptionService.upload(demandeInscriptionDossier, fichier).subscribe({
        next: (res) => {
          // console.log(res)
        },
        error: (err) => {
          console.log(err)
        }
      })
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