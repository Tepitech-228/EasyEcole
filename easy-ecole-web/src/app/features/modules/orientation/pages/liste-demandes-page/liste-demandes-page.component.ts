import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeOrientation } from 'src/app/data/modules/orientation/models/DemandeOrientation.model';
import { ParcoursChoisi } from 'src/app/data/modules/orientation/models/ParcoursChoisi.model';
import { DemandeOrientationService } from 'src/app/data/modules/orientation/services/demande-orientation.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {

  showModal: boolean = true
  selectedDemande?: DemandeOrientation
  demandesOrientation: DemandeOrientation[] = []

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(private demandeOrientationService: DemandeOrientationService) {
    super()
    this.getDemandesOrientation()
  }

  ngOnInit(): void {
  }

  getDemandesOrientation(): void {
    this.demandeOrientationService.getAll()
    .subscribe({
      next: (res) => {
        this.demandesOrientation = res
        console.log(res)
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return DemandeOrientation.tauxDeTraitement(parcoursChoisis)
  }

  openModal(demandeOrientation: DemandeOrientation) {
    this.showModal = true
    this.selectedDemande = demandeOrientation
  }
  
  closeModal(): void {
    this.showModal = false
  }

}
