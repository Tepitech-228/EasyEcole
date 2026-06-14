import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { PrerequisParcours } from 'src/app/data/modules/inscription/models/PrerequisParcours.model';
import { PrerequisParcoursChoisi } from 'src/app/data/modules/inscription/models/PrerequisParcoursChoisi.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { ParcoursChoisiService } from 'src/app/data/modules/inscription/services/parcours-choisi.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { COLUMNS_SCHEMA, PrerequisParcoursType } from 'src/app/data/types/PrerequisParcoursType';

@Component({
  selector: 'app-choix-parcours-page',
  templateUrl: './choix-parcours-page.component.html',
  styleUrls: ['./choix-parcours-page.component.scss']
})
export class ChoixParcoursPageComponent extends BaseComponentClass implements OnInit {

  showChoixParcoursModal: boolean = false
  showConfirmationModal: boolean = false
  containsEmptyNote: boolean = false
  alreadySelected: boolean = false
  minParcoursChoisisError: boolean = false
  maxParcoursChoisisError: boolean = false

  columnsSchema: any = COLUMNS_SCHEMA;
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation
  _prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []
  _prerequisParcoursChoisi: Record<string, number | undefined> = {}

  id: string
  demandeInscription?: DemandeInscription
  selectedParcoursId?: string = undefined
  selectedParcours?: Parcours
  parcours?: Parcours[]

  parcoursChoisis: ParcoursChoisi[] = []
  readonly MIN_PARCOURS_CHOISIS: number = 2
  readonly MAX_PARCOURS_CHOISIS: number = 3

  constructor(
    private demandeInscriptionService: DemandeInscriptionService,
    private parcoursService: ParcoursService,
    private parcoursChoisiService: ParcoursChoisiService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getDemandeInscription()
    // this.getParcoursChoisis()
  }

  ngOnInit(): void {
  }

  private getDemandeInscription(): void {
    this.demandeInscriptionService.get(this.id)
      .subscribe(
        {
          next: (res) => {
            this.demandeInscription = res
            if(this.demandeInscription.parcoursChoisis?.length == 0) {
              console.log(res)
            }
            else {
              this.router.navigate(['/inscription/demandes/' + this.demandeInscription?.id])
            }
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404) {
              this.router.navigate(['/inscription/demandes'])
            }
          },
        }
      )
  }

  getParcours(): void {
    this.parcoursService.getAll()
      .subscribe(
        {
          next: (res) => {
            // TODO:: filter => parcours non choisis  
            this.parcours = res.filter(value => value.niveauEtudeId == this.demandeInscription!.session!.niveauEtudeId)
            // console.log(this.parcours)
            this.selectedParcours = undefined
            this.selectedParcoursId = undefined
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
          },
        }
      )
  }

  openChoixParcoursModal(): void {
    this.minParcoursChoisisError = false
    this.maxParcoursChoisisError = false
    this.showChoixParcoursModal = true
    // this.selectedParcours = undefined
    // this.selectedParcoursId = undefined
    this._prerequisParcours = []
    this._prerequisParcoursChoisi = {}
    this.getParcours()
  }

  closeChoixParcoursModal(): void {
    this.showChoixParcoursModal = false
    this.alreadySelected = false
    this.containsEmptyNote = false
  }

  onChange(event: any) {
    this.alreadySelected = false

    if (this.selectedParcoursId != undefined) {
      console.log("Already selected", this.parcoursChoisis.filter(value => value.parcoursId == this.selectedParcoursId))
      if (this.parcoursChoisis.filter(value => value.parcoursId == this.selectedParcoursId).length == 0) {
        this._prerequisParcours = []
        this._prerequisParcoursChoisi = {}
        this.parcoursService.get(this.selectedParcoursId!).subscribe(
          {
            next: (res) => {
              this.selectedParcours = res
              this.getPrerequisParcours()
              this.getPrerequisParcoursChoisis()
            },
            error: (err: HttpErrorResponse) => {
              console.log(err)
            },
          }
        )
        console.log(this._prerequisParcoursChoisi)
      }
      else {
        this.alreadySelected = true
      }
    }
    else {
      console.log("Set to undefined")
    }
  }

  private getPrerequisParcoursChoisis(): void {
    this.selectedParcours!.prerequisParcours!.forEach(element => {
      this._prerequisParcoursChoisi[element.id!] = undefined
    })
  }

  private getPrerequisParcours(): void {
    let prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []
    const niveauxEtude: NiveauEtude[] = this.selectedParcours!.prerequisParcours!
      // Map to array
      .map(value => value.niveauEtude!)
      // Convert to set
      .reduce((accumulator: NiveauEtude[], current: NiveauEtude) => {
        if (!accumulator.map(value => value.id).includes(current.id)) {
          accumulator.push(current)
        }

        return accumulator;
      }, [])

    niveauxEtude.forEach((niveauEtude: NiveauEtude) => {
      let prerequis: [NiveauEtude, PrerequisParcoursType[]] = [niveauEtude, []]

      let array: PrerequisParcoursType[] = []
      this.selectedParcours!.prerequisParcours!.filter(value => value.niveauEtudeId == niveauEtude.id).forEach((element: PrerequisParcours) => {
        array.push({
          id: element!.id!.toString(),
          matiere: element.matierePrerequis!.libelle!,
          evaluation: element.typeEvaluation!,
          periode: element.periodeEvaluation!,
          note: element.noteRequise!
        })
      })

      prerequis[1] = array
      prerequisParcours.push(prerequis)
    })

    this._prerequisParcours = prerequisParcours
  }

  choisirParcours(): void {
    this.containsEmptyNote = Object.values(this._prerequisParcoursChoisi).filter(value => value == undefined).length != 0
    console.log("Contains Empty note: " + this.containsEmptyNote)

    if (!this.containsEmptyNote) {
      let prerequisParcoursChoisis: PrerequisParcoursChoisi[] = []

      for (const key in this._prerequisParcoursChoisi) {
        const value = this._prerequisParcoursChoisi[key];
        console.log(key + ': ' + value);

        let prerequisParcoursChoisi: PrerequisParcoursChoisi = new PrerequisParcoursChoisi()
        prerequisParcoursChoisi.note = Number(value)
        prerequisParcoursChoisi.prerequisParcoursId = key

        prerequisParcoursChoisis.push(prerequisParcoursChoisi)
      }

      let parcoursChoisi: ParcoursChoisi = new ParcoursChoisi()
      parcoursChoisi.parcoursId = this.selectedParcours!.id!
      parcoursChoisi.parcours = this.selectedParcours
      parcoursChoisi.demandeInscriptionId = this.demandeInscription!.id
      parcoursChoisi.prerequisParcoursChoisis = prerequisParcoursChoisis

      this.parcoursChoisis.push(parcoursChoisi)
      this.closeChoixParcoursModal()
    }
  }

  retirerParcours(i: number): void {
    this.parcoursChoisis = this.parcoursChoisis.filter((value, index) => index != i)
  }

  confirmerChoix(): void {
    console.log(this.parcoursChoisis.length)
    if (this.parcoursChoisis.length < this.MIN_PARCOURS_CHOISIS) {
      this.minParcoursChoisisError = true
    }
    else if (this.parcoursChoisis.length > this.MAX_PARCOURS_CHOISIS) {
      this.maxParcoursChoisisError = true
    }
    else {
      this.showConfirmationModal = true
    }
  }

  valider(): void {
    console.log("Hello world")
    console.log(this.parcoursChoisis)

    this.parcoursChoisis.forEach((parcoursChoisi: ParcoursChoisi) => {
      this.parcoursChoisiService.create(parcoursChoisi)
        .subscribe(
          {
            next: (res) => {
              console.log(res)
              this.closeChoixParcoursModal()
              this.router.navigate(['/inscription/demandes/' + this.demandeInscription?.id])
            },
            error: (err: HttpErrorResponse) => {
              console.log(err)
            },
          }
        )
    })
  }

}
