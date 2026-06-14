import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatierePrerequis } from 'src/app/data/modules/inscription/models/MatierePrerequis.model';
import { MatierePrerequisService } from 'src/app/data/modules/inscription/services/matiere-prerequis.service';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { PrerequisParcours } from 'src/app/data/modules/inscription/models/PrerequisParcours.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PrerequisParcoursService } from 'src/app/data/modules/inscription/services/prerequis-parcours.service';
import { TypesMedia } from 'src/app/data/enums/TypesMedia';
import { COLUMNS_SCHEMA, PrerequisParcoursType } from 'src/app/data/types/PrerequisParcoursType';

@Component({
  selector: 'app-nouveau-parcours-page',
  templateUrl: './nouveau-parcours-page.component.html',
  styleUrls: ['./nouveau-parcours-page.component.scss']
})
export class NouveauParcoursPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  disableButton: boolean = false
  alreadyExists: boolean = false

  columnsSchema: any = COLUMNS_SCHEMA;
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation
  readonly typesMedia = TypesMedia

  niveauxEtude: NiveauEtude[] = []
  matieres: MatierePrerequis[] = []

  nouveauParcoursForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    niveauEtude: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })
  prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []

  // Modals
  showPrerequisModal: boolean = false

  constructor(
    private router: Router,
    private matierePrerequisService: MatierePrerequisService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private prerequisParcoursService: PrerequisParcoursService,
  ) {
    super()
    if (!this.rolesValue.isInstitution) {
      this.router.navigate(['/inscription/parcours'])
    }
    else {
      this.getNiveauxEtude()
      this.getMatieresPrerequis()
    }
  }

  private getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.niveauxEtude = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  private getMatieresPrerequis(): void {
    this.matierePrerequisService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.matieres = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  ngOnInit(): void {
  }

  ajouterPrerequis(prerequisParcours: any): void {
    this.prerequisParcours.push(prerequisParcours)
    console.log(this.prerequisParcours)
  }

  retirerPrerequis(i: number): void {
    this.prerequisParcours = this.prerequisParcours.filter((value, index) => index != i)
  }

  // 
  create(): void {
    this.nouveauParcoursForm.markAllAsTouched()
    console.log(this.nouveauParcoursForm.value);

    if (this.nouveauParcoursForm.valid) {
      let parcours: Parcours = new Parcours()
      parcours.titre = this.nouveauParcoursForm.get('titre')!.value
      parcours.description = this.nouveauParcoursForm.get('description')!.value
      parcours.niveauEtudeId = this.nouveauParcoursForm.get('niveauEtude')!.value

      this.parcoursService.create(parcours)
        .subscribe(
          {
            next: (res) => {
              let parcoursId = res.id
              this.prerequisParcours.forEach((element) => {
                const niveauEtudeId: string = element[0].id as string

                element[1].forEach(value => {
                  let prerequis: PrerequisParcours = new PrerequisParcours()
                  prerequis.parcoursId = parcoursId!
                  prerequis.matierePrerequisId = value.matiere
                  prerequis.niveauEtudeId = niveauEtudeId
                  prerequis.typeEvaluation = value.evaluation
                  prerequis.periodeEvaluation = value.periode
                  prerequis.noteRequise = value.note

                  this.prerequisParcoursService.create(prerequis).subscribe({
                    next: (res) => {
                      console.log("Success")
                    },
                    error: (err: HttpErrorResponse) => {
                      console.log(err)
                    }
                  })
                })
              })
            },
            error: (err: HttpErrorResponse) => {
              console.log(err)
              this.alreadyExists = err.error.alreadyExists
              if (!this.alreadyExists) {
                this.error = true
              }

              setTimeout(() => {
                this.error = false
                this.alreadyExists = false
              }, 3000)
            },
            complete: () => {
              this.disableButton = false
              console.log("Finished")
              this.router.navigateByUrl("/inscription/parcours")
            },
          }
        )
    }
    else {
      console.log('Error')
    }
  }

}
