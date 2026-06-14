import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneesParcours } from 'src/app/data/enums/AnneesParcours';
import { EtatsCoursChoisi } from 'src/app/data/enums/EtatsCoursChoisi';
import { SemestresParcours } from 'src/app/data/enums/SemestresParcours';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { DemandeInscriptionCours } from 'src/app/data/modules/inscription/models/DemandeInscriptionCours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { RolesValueType } from 'src/app/data/types/RolesValueType';

@Component({
  selector: 'app-cours-section',
  templateUrl: './cours-section.component.html',
  styleUrls: ['./cours-section.component.scss']
})
export class CoursSectionComponent implements OnInit {

  showValidationModal: boolean = false

  @Input() demandeId!: string
  @Input() parcours?: Parcours
  @Input() coursChoisis?: DemandeInscriptionCours[]
  @Input() rolesValue!: RolesValueType
  @Output() nextStep: EventEmitter<any> = new EventEmitter()
  cours: Cours[] = []
  readonly anneesParcours = AnneesParcours
  readonly semestresParcours = SemestresParcours
  readonly etatsCoursChoisi = EtatsCoursChoisi

  choixCours: { [id: string]: boolean }[] = []

  allSelected: boolean = false
  allDeselected: boolean = false

  constructor(
    private coursService: CoursService,
    private demandeInscriptionService: DemandeInscriptionService) {
  }

  ngOnInit(): void {
    if (this.coursChoisis == undefined || this.coursChoisis.length == 0) {
      if (this.parcours) {
        this.getAllCours()
      }
    }
    else {
      this.cours = this.coursChoisis.map(coursChoisi => coursChoisi.cours!)
    }
  }

  deselectAllCours(): void {
    this.allSelected = false
    if (this.allDeselected) {
      this.cours.forEach(value => {
        this.choixCours[value.id!] = value.estObligatoire ?? false
      })
    }
  }

  selectAllCours(): void {
    this.allDeselected = false
    if (this.allSelected) {
      this.cours.forEach(value => {
        this.choixCours[value.id!] = true
      })
    }
    else {
      this.cours.forEach(value => {
        this.choixCours[value.id!] = value.estObligatoire ?? false
      })
    }
  }

  getEtatCoursChoisi(coursId: string): EtatsCoursChoisi {
    const coursChoisi: DemandeInscriptionCours | undefined = this.coursChoisis?.find(coursChoisi => coursChoisi.coursId == coursId)

    if (coursChoisi != undefined) {
      return coursChoisi.etat!
    }
    return EtatsCoursChoisi.ENCOURS
  }

  private getAllCours(): void {
    this.coursService.getAll(this.parcours!.id).subscribe({
      next: (res) => {
        this.cours = res
        this.cours.forEach(value => {
          this.choixCours[value.id!] = value.estObligatoire ?? false
        })
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  validerCoursChoisis(): void {
    for (let key in this.choixCours) {
      console.log(key + ': ' + this.choixCours[key])
      if (this.choixCours[key]) {
        let demandeInscriptionCours: DemandeInscriptionCours = new DemandeInscriptionCours()
        demandeInscriptionCours.coursId = key
        this.demandeInscriptionService.createCours(this.demandeId, demandeInscriptionCours).subscribe({
          next: (res) => {

          },
          error: (err) => {
            console.log(err)
          }
        })
      }
    }

    window.location.reload()
  }

  updateCoursChoisi(coursId: string, etat: EtatsCoursChoisi): void {
    const coursChoisi: DemandeInscriptionCours | undefined = this.coursChoisis?.find(coursChoisi => coursChoisi.coursId == coursId)

    if (coursChoisi != undefined && coursChoisi.etat != etat) {
      // console.log(coursChoisi, etat)
      coursChoisi.etat = etat
      this.demandeInscriptionService.updateCours(coursChoisi.demandeInscriptionId!, coursChoisi)
        .subscribe({
          next: (res) => {
            // console.log(res)
          },
          error: (err) => {
            console.log(err)
          }
        })
    }
  }

  updateAllCoursChoisi(etat: EtatsCoursChoisi): void {
    this.coursChoisis?.forEach(coursChoisi => {
      if (coursChoisi != undefined && coursChoisi.etat != etat) {
        // console.log(coursChoisi, etat)
        coursChoisi.etat = etat
        this.demandeInscriptionService.updateCours(coursChoisi.demandeInscriptionId!, coursChoisi)
          .subscribe({
            next: (res) => {
              // console.log(res)
            },
            error: (err) => {
              console.log(err)
            }
          })
      }
    });
  }

}
