import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EtatsValidationParcours } from 'src/app/data/enums/EtatsValidationParcours';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { PrerequisParcoursChoisi } from 'src/app/data/modules/inscription/models/PrerequisParcoursChoisi.model';
import { ParcoursChoisiService } from 'src/app/data/modules/inscription/services/parcours-choisi.service';
import { PrerequisParcoursChoisiType } from 'src/app/data/types/PrerequisParcoursChoisiType';
import { COLUMNS_SCHEMA_2 } from 'src/app/data/types/PrerequisParcoursType';
import { RolesValueType } from 'src/app/data/types/RolesValueType';

@Component({
  selector: 'app-choix-parcours-section',
  templateUrl: './choix-parcours-section.component.html',
  styleUrls: ['./choix-parcours-section.component.scss']
})
export class ChoixParcoursSectionComponent implements OnInit {

  @Input() demande!: DemandeInscription
  @Input() rolesValue!: RolesValueType
  @Input() parcours?: Parcours
  @Output() nextStep: EventEmitter<any> = new EventEmitter()

  index: number = 0
  columnsSchema: any = COLUMNS_SCHEMA_2;
  readonly etatsValidationParcours = EtatsValidationParcours
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation
  _prerequisParcours?: [NiveauEtude, PrerequisParcoursChoisiType[]][]

  choixParcoursFinal?: string

  constructor(private parcoursChoisiService: ParcoursChoisiService) { }

  ngOnInit(): void {
    if (this.demande!.parcoursChoisis!.length > 0) {
      this.getPrerequisParcours()
    }
    // console.log(this.parcours)
    if(this.parcours) {
      this.choixParcoursFinal = this.demande!.parcoursChoisis!.find(value => value.parcours!.id == this.parcours!.id)?.id
      console.log(this.parcours, this.choixParcoursFinal)
    }
  }

  validerParcoursChoisi(): void {
    let parcoursChoisi: ParcoursChoisi = this.demande!.parcoursChoisis![this.index]
    parcoursChoisi.etatDeValidation = EtatsValidationParcours.VALIDE

    this.parcoursChoisiService.update(parcoursChoisi)
      .subscribe({
        next: (res) => {
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  rejeterParcoursChoisi(): void {
    let parcoursChoisi: ParcoursChoisi = this.demande!.parcoursChoisis![this.index]
    parcoursChoisi.etatDeValidation = EtatsValidationParcours.REJETE

    this.parcoursChoisiService.update(parcoursChoisi)
      .subscribe({
        next: (res) => {
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return DemandeInscription.tauxDeTraitement(parcoursChoisis)
  }

  private getPrerequisParcours(): void {
    let prerequisParcours: [NiveauEtude, PrerequisParcoursChoisiType[]][] = []
    const niveauxEtude: NiveauEtude[] = this.demande!.parcoursChoisis![this.index].prerequisParcoursChoisis!
      // Map to array
      .map(value => value.prerequisParcours!.niveauEtude!)
      // Convert to set
      .reduce((accumulator: NiveauEtude[], current: NiveauEtude) => {
        if (!accumulator.map(value => value.id).includes(current.id)) {
          accumulator.push(current)
        }

        return accumulator;
      }, [])

    niveauxEtude.forEach((niveauEtude: NiveauEtude) => {
      let prerequis: [NiveauEtude, PrerequisParcoursChoisiType[]] = [niveauEtude, []]

      let array: PrerequisParcoursChoisiType[] = []

      let parcoursChoisi: ParcoursChoisi = this.demande!.parcoursChoisis![this.index]
      parcoursChoisi.prerequisParcoursChoisis!
        .filter((value: PrerequisParcoursChoisi) => {
          // console.log(value!.prerequisParcours!.niveauEtudeId, niveauEtude.id)
          return value!.prerequisParcours!.niveauEtudeId == niveauEtude.id
        })
        .forEach((element: PrerequisParcoursChoisi) => {
          array.push({
            id: element!.id!.toString(),
            matiere: element.prerequisParcours!.matierePrerequis!.libelle!,
            evaluation: element.prerequisParcours!.typeEvaluation!,
            periode: element.prerequisParcours!.periodeEvaluation!,
            note: element.prerequisParcours!.noteRequise!,
            note2: element.note!
          })
        })

      prerequis[1] = array
      prerequisParcours.push(prerequis)
    })

    this._prerequisParcours = prerequisParcours
  }

  nextParcoursChoisi(): void {
    if (this.index < this.demande!.parcoursChoisis!.length - 1) {
      this.index++
      this.getPrerequisParcours()
    }
  }

  prevParcoursChoisi(): void {
    if (this.index > 0) {
      this.index--
      this.getPrerequisParcours()
    }
  }

  validerChoixParcoursFinal(): void {
    let parcoursChoisi: ParcoursChoisi | undefined = this.demande!.parcoursChoisis!.find((element) => element.id == this.choixParcoursFinal);
    if (parcoursChoisi != undefined) {
      parcoursChoisi.choixFinal = true
      this.parcoursChoisiService.update(parcoursChoisi).subscribe({
        next: () => {
          // window.location.reload()
          this.nextStep.emit()
        },
        error: (err) => {
          console.log(err)
        }
      })
    }
  }

}
