import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
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
  readonly PHOTOS_ENSEIGNANTS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS_ENSEIGNANTS
  readonly QR_CODES_PATH: string = environment.QR_CODES_ENSEIGNANTS_PATH

  id: string
  enseignant?: Enseignant
  photoUploading: boolean = false
  qrRegenerating: boolean = false

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

  /** URL image QR avec token (?token=) : les <img> ne passent pas par l'intercepteur HTTP. */
  qrSrc(fileName: string): string {
    const token = localStorage.getItem(LocalStorageService.AUTH_TOKEN) || ''
    return `${this.QR_CODES_PATH}${fileName}?token=${token}`
  }

  regenererQr(): void {
    if (!this.enseignant?.id || this.qrRegenerating) return
    this.qrRegenerating = true
    this.enseignantService.generateQrCodes(this.enseignant.id).subscribe({
      next: () => {
        this.qrRegenerating = false
        this.getEnseignant()
      },
      error: () => { this.qrRegenerating = false }
    })
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files && input.files[0]
    if (!file || !this.enseignant?.id) return
    this.photoUploading = true
    this.enseignantService.updatePhotoById(this.enseignant.id, file).subscribe({
      next: () => {
        this.photoUploading = false
        this.getEnseignant()
      },
      error: () => { this.photoUploading = false }
    })
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
