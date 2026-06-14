import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {

  showModal: boolean = true
  selectedDemande?: DemandeInscription
  demandesInscription: DemandeInscription[] = []

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(private demandeInscriptionService: DemandeInscriptionService) {
    super()
    this.getDemandesInscription()
  }

  ngOnInit(): void {
  }

  getDemandesInscription(): void {
    this.demandeInscriptionService.getAll()
    .subscribe({
      next: (res) => {
        this.demandesInscription = res
        console.log(res)
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return DemandeInscription.tauxDeTraitement(parcoursChoisis)
  }

  openModal(demandeInscription: DemandeInscription) {
    this.showModal = true
    this.selectedDemande = demandeInscription
  }
  
  closeModal(): void {
    this.showModal = false
  }

}
