import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { DemandeOrientation } from 'src/app/data/modules/orientation/models/DemandeOrientation.model';
import { PanierParcoursChoisi } from 'src/app/data/modules/orientation/models/PanierParcoursChoisi.model';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { DemandeOrientationService } from 'src/app/data/modules/orientation/services/demande-orientation.service';
import { PanierParcoursChoisiService } from 'src/app/data/modules/orientation/services/panier-parcours-choisi.service';
import { ParcoursChoisiService } from 'src/app/data/modules/orientation/services/parcours-choisi.service';

@Component({
  selector: 'app-panier-parcours',
  templateUrl: './panier-parcours.component.html',
  styleUrls: ['./panier-parcours.component.scss']
})
export class PanierParcoursComponent implements OnInit, OnChanges {

  @Input() showPanierModal: boolean = false
  @Output() onCloseModal: EventEmitter<any> = new EventEmitter()

  panierParcoursChoisis: PanierParcoursChoisi[] = []

  constructor(
    private panierParcoursChoisiService: PanierParcoursChoisiService,
    private demandeOrientationService: DemandeOrientationService,
    private parcoursChoisiService: ParcoursChoisiService,
    private router: Router) {
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showPanierModal'].currentValue == true) {
      this.getPanier()
    }
  }

  getPanier(): void {
    this.panierParcoursChoisiService.getAll()
      .subscribe({
        next: (res) => {
          this.panierParcoursChoisis = res
          console.log(res);
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  removePanierParcoursChoisi(id: string): void {
    this.panierParcoursChoisiService.delete(id)
      .subscribe({
        next: (res) => {
          this.getPanier()
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  faireDemandeOrientation(): void {
    let demandeOrientation: DemandeOrientation = new DemandeOrientation()
    demandeOrientation.dateDemande = new Date()

    this.demandeOrientationService.create(demandeOrientation)
      .subscribe({
        next: async (res) => {
          let demandeId = res.id!

          this.panierParcoursChoisis.map(value => value.parcoursChoisi!).forEach(async (parcoursChoisi) => {
            parcoursChoisi.demandeOrientationId = demandeId
            console.log(demandeId, parcoursChoisi)

            await this.parcoursChoisiService.update(parcoursChoisi)
              .toPromise()
              .then((res) => { console.log(res) })
              .catch((err) => { console.log(err) })
          })

          this.viderPanier()
          this.closeModal()
          this.router.navigate(['/orientation/demandes'])
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  viderPanier(): void {
    this.panierParcoursChoisiService.deleteAll()
      .subscribe({
        next: (res) => {
          this.getPanier()
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  getDuree(parcours: Parcours): string {
    return Parcours.getDuree(parcours.dureeDeFormation!)
  }

  closeModal(): void {
    this.showPanierModal = false
    this.onCloseModal.emit()
  }

}
