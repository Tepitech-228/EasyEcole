import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { Ecue } from 'src/app/data/modules/inscription/models/Ecue.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { EcueService } from 'src/app/data/modules/inscription/services/ecue.service';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';

@Component({
  selector: 'app-liste-cours-page',
  templateUrl: './liste-cours-page.component.html',
  styleUrls: ['./liste-cours-page.component.scss']
})
export class ListeCoursPageComponent extends BaseComponentClass implements OnInit {

  cursusApprenant?: CursusApprenant
  cours: Cours[] = []
  _cours: Cours[] = []
  niveauxEtude: NiveauEtude[] = []
  _niveauxEtude: NiveauEtude[] = []
  parcours: Parcours[] = []
  _parcours: Parcours[] = []

  selectedNiveauEtude: string = 'undefined'
  selectedParcours: string = 'undefined'

  searchCours?: string

  showNouveauCoursModal: boolean = false
  nouveauCoursForm: FormGroup = new FormGroup({
    code: new FormControl(null, [Validators.required]),
    intitule: new FormControl(null, [Validators.required]),
    credit: new FormControl(null, []),
    creditEcts: new FormControl(null, []),
    semestre: new FormControl(null, []),
    description: new FormControl(null, []),
    objectifs: new FormControl(null, []),
    estObligatoire: new FormControl(false, []),
    parcoursId: new FormControl(null, [Validators.required]),
    ecues: new FormArray([]),
  })

  constructor(
    private router: Router,
    private niveauEtudeService: NiveauEtudeService,
    private coursService: CoursService,
    private ecueService: EcueService,
    private cursusApprenantService: CursusApprenantService,
    private parcoursService: ParcoursService,
  ) {
    super()
    this.getNiveauxEtude()
    this.getParcours()

    if (this.rolesValue.isApprenant) {
      this.getCoursChoisis()
    }
    else {
      this.getCours()
    }
  }

  get ecuesFormArray(): FormArray {
    return this.nouveauCoursForm.get('ecues') as FormArray
  }

  ajouterEcue(): void {
    this.ecuesFormArray.push(new FormGroup({
      code: new FormControl(null, [Validators.required]),
      libelle: new FormControl(null, [Validators.required]),
      creditEcts: new FormControl(null, []),
      coefficient: new FormControl(null, []),
    }))
  }

  supprimerEcue(index: number): void {
    this.ecuesFormArray.removeAt(index)
  }

  openNouveauCoursModal(): void {
    this.nouveauCoursForm.reset()
    this.ecuesFormArray.clear()
    this.showNouveauCoursModal = true
  }

  closeNouveauCoursModal(): void {
    this.showNouveauCoursModal = false
  }

  ajouterCours(): void {
    this.nouveauCoursForm.markAllAsTouched()
    if (this.nouveauCoursForm.valid) {
      const cours = new Cours()
      cours.code = this.nouveauCoursForm.get('code')!.value
      cours.intitule = this.nouveauCoursForm.get('intitule')!.value
      cours.credit = this.nouveauCoursForm.get('credit')!.value
      cours.creditEcts = this.nouveauCoursForm.get('creditEcts')!.value
      cours.semestre = this.nouveauCoursForm.get('semestre')!.value
      cours.description = this.nouveauCoursForm.get('description')!.value
      cours.objectifs = this.nouveauCoursForm.get('objectifs')!.value
      cours.estObligatoire = this.nouveauCoursForm.get('estObligatoire')!.value
      cours.parcoursId = this.nouveauCoursForm.get('parcoursId')!.value

      const ecuesSaisis = this.ecuesFormArray.value.filter((e: any) => e.code && e.libelle)

      this.coursService.create(cours).subscribe({
        next: (res) => {
          if (ecuesSaisis.length === 0) {
            this.router.navigate(['/cours/cours/' + res.id])
            return
          }

          const observables = ecuesSaisis.map((e: any) => {
            const ecue = new Ecue()
            ecue.code = e.code
            ecue.libelle = e.libelle
            ecue.creditEcts = e.creditEcts
            ecue.coefficient = e.coefficient || 1
            ecue.coursId = res.id
            return this.ecueService.create(ecue)
          })

          forkJoin(observables).subscribe({
            next: () => this.router.navigate(['/cours/cours/' + res.id]),
            error: (err) => {
              console.log(err)
              this.router.navigate(['/cours/cours/' + res.id])
            },
          })
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
        },
      })
    }
  }

  ngOnInit(): void {
  }

  filtrerCours(): void {
    // console.log(this.selectedNiveauEtude, this.selectedClasse, this.selectedParcours)

    this._niveauxEtude = this.niveauxEtude.filter((value: NiveauEtude) => {
      return this.selectedNiveauEtude == 'undefined' || value.id == this.selectedNiveauEtude
    })
    this._parcours = this.parcours.filter((value: Parcours) => {
      return this.selectedNiveauEtude == 'undefined' || value.niveauEtudeId == this.selectedNiveauEtude
    })

    this._cours = this.cours.filter((value: Cours) => {
      return (this.selectedNiveauEtude == 'undefined' || value.parcours?.niveauEtudeId == this.selectedNiveauEtude) &&
        (this.selectedParcours == 'undefined' || value.parcoursId == this.selectedParcours)
    })
  }

  supprimerFiltres(): void {
    this.searchCours = undefined
    
    this.selectedNiveauEtude = 'undefined'
    this.selectedParcours = 'undefined'
    this.filtrerCours()
  }

  rechercherCours(): void {
    if (this.searchCours == undefined || this.searchCours == '') {
      this._cours = this.cours
    }
    else {
      this._cours = this.cours.filter((value: Cours) => {
        console.log(value.intitule!.toLowerCase().includes(this.searchCours!.toLowerCase()))
        return value.intitule!.toLowerCase().includes(this.searchCours!.toLowerCase())
      })
    }
  }

  getCoursChoisis(): void {
    this.cursusApprenantService.getCoursChoisis()
      .subscribe(
        {
          next: (res) => {
            this.cursusApprenant = res

            if (this.cursusApprenant != null) {
              this.cours = this.cursusApprenant.demandeInscription?.cours ?? []
              this.filtrerCours()
            }
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getCours(): void {
    this.coursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.cours = res
            this.filtrerCours()
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.niveauxEtude = res
            this._niveauxEtude = this.niveauxEtude
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getParcours(): void {
    this.parcoursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this._parcours = this.parcours
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }
}