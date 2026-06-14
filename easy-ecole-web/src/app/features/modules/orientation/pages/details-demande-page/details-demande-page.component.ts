import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeOrientation } from 'src/app/data/modules/orientation/models/DemandeOrientation.model';
import { NiveauEtude } from 'src/app/data/modules/orientation/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { ParcoursChoisi } from 'src/app/data/modules/orientation/models/ParcoursChoisi.model';
import { DemandeOrientationService } from 'src/app/data/modules/orientation/services/demande-orientation.service';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { PrerequisParcoursChoisi } from 'src/app/data/modules/orientation/models/PrerequisParcoursChoisi.model';
import { EtatsValidationParcours } from 'src/app/data/enums/EtatsValidationParcours';
import { ParcoursChoisiService } from 'src/app/data/modules/orientation/services/parcours-choisi.service';
import { ReponseOrientationService } from 'src/app/data/modules/orientation/services/reponse-orientation.service';
import { ReponseOrientation } from 'src/app/data/modules/orientation/models/ReponseOrientation.model';
import { COLUMNS_SCHEMA_2 } from 'src/app/data/types/PrerequisParcoursType';
import { PrerequisParcoursChoisiType } from 'src/app/data/types/PrerequisParcoursChoisiType';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-details-demande-page',
  templateUrl: './details-demande-page.component.html',
  styleUrls: ['./details-demande-page.component.scss']
})
export class DetailsDemandePageComponent extends BaseComponentClass implements OnInit {

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  id: string
  demande?: DemandeOrientation
  index: number = 0
  showReponseModal: boolean = false
  demandeTraitee: boolean = true
  messageReponseOrientation?: string

  columnsSchema: any = COLUMNS_SCHEMA_2;
  readonly etatsValidationParcours = EtatsValidationParcours
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation
  _prerequisParcours: [NiveauEtude, PrerequisParcoursChoisiType[]][] = []

  constructor(
    private demandeOrientationService: DemandeOrientationService,
    private parcoursChoisiService: ParcoursChoisiService,
    private reponseOrientationService: ReponseOrientationService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getDemandeOrientation(this.id)
  }

  ngOnInit(): void {
  }

  private getDemandeOrientation(id: string): void {
    this.demandeOrientationService.get(this.id!)
      .subscribe({
        next: (res) => {
          this.demande = res
          this.getPrerequisParcours()
          console.log(res)
        },
        error: (err) => {
          console.log(err)
          if (err.status == 404) {
            this.router.navigate(['/orientation/demandes'])
          }
        }
      })
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

  getDuree(parcours: Parcours): string {
    return Parcours.getDuree(parcours.dureeDeFormation!)
  }

  tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return DemandeOrientation.tauxDeTraitement(parcoursChoisis)
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

  envoyerReponseOrientation(): void {
    let parcoursChoisis: ParcoursChoisi[] = this.demande!.parcoursChoisis!
    this.demandeTraitee = parcoursChoisis.filter((value) => value.etatDeValidation == EtatsValidationParcours.VALIDE || value.etatDeValidation == EtatsValidationParcours.REJETE).length == parcoursChoisis.length

    if (this.demandeTraitee) {
      let reponseOrientation: ReponseOrientation = new ReponseOrientation()
      reponseOrientation.message = this.messageReponseOrientation
      reponseOrientation.dateReponse = new Date()
      reponseOrientation.demandeOrientationId = this.demande?.id!

      this.reponseOrientationService.create(reponseOrientation)
        .subscribe({
          next: (res) => {
            console.log("OK: ", res)
            this.router.navigate(['/orientation/demandes'])
          },
          error: (err) => {
            console.log(err)
          }
        })
    }
  }

  closeModal(): void {
    this.messageReponseOrientation = undefined
    this.demandeTraitee = true
    this.showReponseModal = false
  }

}
