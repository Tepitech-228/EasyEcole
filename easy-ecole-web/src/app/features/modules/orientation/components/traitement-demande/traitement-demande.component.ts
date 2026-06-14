import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { DemandeOrientation } from 'src/app/data/modules/orientation/models/DemandeOrientation.model';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { ParcoursChoisi } from 'src/app/data/modules/orientation/models/ParcoursChoisi.model';
import { DemandeOrientationService } from 'src/app/data/modules/orientation/services/demande-orientation.service';
import { ParcoursChoisiService } from 'src/app/data/modules/orientation/services/parcours-choisi.service';

@Component({
  selector: 'app-traitement-demande',
  templateUrl: './traitement-demande.component.html',
  styleUrls: ['./traitement-demande.component.scss']
})
export class TraitementDemandeComponent implements OnInit, OnChanges {

  @Input() showModal: boolean = false
  @Input() demandeId?: DemandeOrientation['id']
  @Output() onCloseModal: EventEmitter<any> = new EventEmitter()

  demande?: DemandeOrientation

  constructor(
    private demandeOrientationService: DemandeOrientationService,
    private router: Router) {
    this.getDemandeOrientation()
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showPanierModal'].currentValue == true) {
    }
  }

  private getDemandeOrientation(): void {
    this.demandeOrientationService.get(this.demandeId!)
      .subscribe({
        next: (res) => {
          this.demande = res
          console.log(res)
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  getDuree(parcours: Parcours): string {
    return Parcours.getDuree(parcours.dureeDeFormation!)
  }

  tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return DemandeOrientation.tauxDeTraitement(parcoursChoisis)
  }

  closeModal(): void {
    this.showModal = false
    this.onCloseModal.emit()
  }
}
