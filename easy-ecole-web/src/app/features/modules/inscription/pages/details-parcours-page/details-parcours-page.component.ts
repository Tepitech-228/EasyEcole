import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { PrerequisParcours } from 'src/app/data/modules/inscription/models/PrerequisParcours.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { COLUMNS_SCHEMA, PrerequisParcoursType } from 'src/app/data/types/PrerequisParcoursType';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { AnneesParcours } from 'src/app/data/enums/AnneesParcours';
import { SemestresParcours } from 'src/app/data/enums/SemestresParcours';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';

@Component({
  selector: 'app-details-parcours-page',
  templateUrl: './details-parcours-page.component.html',
  styleUrls: ['./details-parcours-page.component.scss']
})
export class DetailsParcoursPageComponent extends BaseComponentClass implements OnInit {

  containsEmptyNote: boolean = false
  error: boolean = false
  alreadyExists: boolean = false

  showNouveauCoursModal: boolean = false
  showEditerCoursModal: boolean = false
  showSupprimerCoursModal: boolean = false

  selectedCours?: Cours

  columnsSchema: any = COLUMNS_SCHEMA;
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation
  _prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []

  id: string
  parcours?: Parcours

  classes: Classe[] = []

  coursForm: FormGroup = new FormGroup({
    code: new FormControl(null, [Validators.required]),
    intitule: new FormControl(null, [Validators.required]),
    credit: new FormControl(null, []),
    description: new FormControl(null, []),
    estObligatoire: new FormControl(false, [Validators.required]),
    classe: new FormControl(null, [Validators.required]),
    semestre: new FormControl(null, [Validators.required]),
  })
  readonly anneesParcours = AnneesParcours
  readonly semestresParcours = SemestresParcours

  constructor(
    private parcoursService: ParcoursService,
    private coursService: CoursService,
    private classeService: ClasseService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getParcours()
  }

  ngOnInit(): void {
  }

  private getPrerequisParcours(): void {
    let prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []
    const niveauxEtude: NiveauEtude[] = this.parcours!.prerequisParcours!
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
      this.parcours!.prerequisParcours!.filter(value => value.niveauEtudeId == niveauEtude.id).forEach((element: PrerequisParcours) => {
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

  getParcours(): void {
    this.parcoursService.get(this.id)
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this.getClasses()
            this.getPrerequisParcours()
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404) {
              this.router.navigate(['/inscription/parcours'])
            }
          },
        }
      )
  }

  getClasses(): void {
    this.classeService.getAll(this.parcours?.niveauEtudeId)
      .subscribe(
        {
          next: (res) => {
            this.classes = res
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
          },
        }
      )
  }

  supprimerParcours(): void {
    this.parcoursService.delete(this.id)
      .subscribe(
        {
          next: () => {
            this.router.navigate(['/inscription/parcours'])
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404) {
              this.router.navigate(['/inscription/parcours'])
            }
          },
        }
      )
  }

  ajouterCours(): void {
    console.log(this.coursForm.value)
    this.coursForm.markAllAsTouched()
    if (this.coursForm.valid && this.parcours) {
      let cours: Cours = new Cours()
      cours.code = this.coursForm.get('code')!.value
      cours.intitule = this.coursForm.get('intitule')!.value
      cours.credit = this.coursForm.get('credit')!.value
      cours.description = this.coursForm.get('description')!.value
      cours.estObligatoire = this.coursForm.get('estObligatoire')!.value
      cours.classeId = this.coursForm.get('classe')!.value
      cours.semestre = this.coursForm.get('semestre')!.value
      cours.parcoursId = this.parcours.id

      this.coursService.create(cours).subscribe({
        next: (res) => {
          this.getParcours()
          this.closeNouveauCoursModal()
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
  }

  modifierCours(): void {
    console.log(this.coursForm.value)
    this.coursForm.markAllAsTouched()
    if (this.coursForm.valid && this.parcours && this.selectedCours) {
      let cours: Cours = new Cours()
      cours.id = this.selectedCours.id
      cours.code = this.coursForm.get('code')!.value
      cours.intitule = this.coursForm.get('intitule')!.value
      cours.credit = this.coursForm.get('credit')!.value
      cours.description = this.coursForm.get('description')!.value
      cours.estObligatoire = this.coursForm.get('estObligatoire')!.value
      cours.classeId = this.coursForm.get('classe')!.value
      cours.semestre = this.coursForm.get('semestre')!.value
      cours.parcoursId = this.parcours.id

      this.coursService.update(cours).subscribe({
        next: (res) => {
          this.getParcours()
          this.closeEditerCoursModal()
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
  }

  supprimerCours(): void {
    if (this.selectedCours) {
      this.coursService.delete(this.selectedCours.id!).subscribe({
        next: (res) => {
          this.getParcours()
          this.closeSupprimerCoursModal()
        },
        error: (err) => {
          console.log(err)
          this.error = true

          setTimeout(() => {
            this.error = false
          }, 3000)
        }
      })
    }
  }

  // Modals
  closeNouveauCoursModal(): void {
    this.showNouveauCoursModal = false
    this.coursForm.reset()
    this.coursForm.get('estObligatoire')!.setValue(false)
  }

  openEditerCoursModal(cours: Cours): void {
    this.selectedCours = cours

    this.coursForm.get('code')!.setValue(this.selectedCours?.code)
    this.coursForm.get('intitule')!.setValue(this.selectedCours?.intitule)
    this.coursForm.get('credit')!.setValue(this.selectedCours?.credit)
    this.coursForm.get('description')!.setValue(this.selectedCours?.description)
    this.coursForm.get('estObligatoire')!.setValue(this.selectedCours?.estObligatoire)
    this.coursForm.get('classe')!.setValue(this.selectedCours?.classe?.id)
    this.coursForm.get('semestre')!.setValue(this.selectedCours?.semestre)

    this.showEditerCoursModal = true
  }

  closeEditerCoursModal(): void {
    this.showEditerCoursModal = false
    this.coursForm.reset()
    this.coursForm.get('estObligatoire')!.setValue(false)
    this.selectedCours = undefined
  }

  openSupprimerCoursModal(cours: Cours): void {
    this.selectedCours = cours
    this.showSupprimerCoursModal = true
  }

  closeSupprimerCoursModal(): void {
    this.showSupprimerCoursModal = false
    this.selectedCours = undefined
  }

}
