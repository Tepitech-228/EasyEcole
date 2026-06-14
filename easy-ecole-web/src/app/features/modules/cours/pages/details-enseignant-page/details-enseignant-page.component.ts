import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneesParcours } from 'src/app/data/enums/AnneesParcours';
import { SemestresParcours } from 'src/app/data/enums/SemestresParcours';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-details-enseignant-page',
  templateUrl: './details-enseignant-page.component.html',
  styleUrls: ['./details-enseignant-page.component.scss']
})
export class DetailsEnseignantPageComponent extends BaseComponentClass implements OnInit {

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  id: string
  enseignant?: Enseignant

  cours: Cours[] = []
  coursLoading: boolean = false

  showAssignerCoursModal: boolean = false
  chargeDuCoursActuel?: Enseignant

  readonly anneesParcours = AnneesParcours
  readonly semestresParcours = SemestresParcours

  assignerCoursForm: FormGroup = new FormGroup({
    cours: new FormControl(null, [Validators.required]),
  })

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private coursService: CoursService,
    private enseignantService: EnseignantService
  ) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getEnseignant()
  }

  ngOnInit(): void {
  }

  customCoursSearchFn(term: string, item: Cours) {
    term = term.toLowerCase();
    return item.intitule!.toLowerCase().indexOf(term) > -1 || item.code!.toLowerCase().indexOf(term) > -1;
  }

  onCoursChange(event: Cours): void {
    // console.log(event)
    if (event != undefined && event.enseignant != undefined) {
      this.chargeDuCoursActuel = event.enseignant
    }
    else {
      this.chargeDuCoursActuel = undefined
    }
  }

  getEnseignant(): void {
    this.enseignantService.get(this.id)
      .subscribe({
        next: (res) => {
          if (res == null) {
            this.router.navigate(['/cours/enseignants'])
          }
          else {
            this.enseignant = res
            // console.log(res)
          }
        },
        error: (err) => {
          console.log(err)
          if (err.status == 404) {
            this.router.navigate(['/cours/enseignants'])
          }
        }
      })
  }

  getCours(): void {
    this.coursLoading = true

    this.coursService.getAll()
      .subscribe({
        next: (res) => {
          this.cours = res
        },
        error: (err) => {
          console.log(err)
        },
        complete: () => {
          this.coursLoading = false
        }
      })
  }

  assignerCours(): void {
    this.assignerCoursForm.markAllAsTouched()

    if (this.assignerCoursForm.valid && this.enseignant) {
      let cours: Cours = new Cours()
      cours.id = this.assignerCoursForm.get('cours')!.value

      this.coursService.assignerEnseignant(cours, this.enseignant)
        .subscribe({
          next: (res) => {
            this.closeAssignerCoursModal()
            this.getEnseignant()
          },
          error: (err) => {
            console.log(err)
          }
        })
    }
  }

  revoquerAssignationCours(cours: Cours): void {
    let confirmationRevoquerAssignationCours: boolean = window.confirm("Êtes-vous de vouloir révoquer l'assignation de ce cours à cet enseignant ?")

    if (confirmationRevoquerAssignationCours) {
      this.coursService.revoquerAssignationCours(cours)
        .subscribe({
          next: (res) => {
            this.getEnseignant()
          },
          error: (err) => {
            console.log(err)
          }
        })
    }
  }

  // Modals
  openAssignerCoursModal(): void {
    this.showAssignerCoursModal = true
    this.getCours()
  }

  closeAssignerCoursModal(): void {
    this.showAssignerCoursModal = false
    this.assignerCoursForm.reset()
  }

}
