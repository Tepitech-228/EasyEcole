import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { Echeance } from 'src/app/data/modules/inscription/models/Echeance.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { EcheanceService } from 'src/app/data/modules/inscription/services/echeance.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bordereaux-page',
  templateUrl: './bordereaux-page.component.html',
  styleUrls: ['./bordereaux-page.component.scss']
})
export class BordereauxPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false

  showUploadBordereauModal: boolean = false
  showDetailsBordereauModal: boolean = false

  bordereaux: Bordereau[] = []
  echeances: Echeance[] = []
  selectedBordereau?: Bordereau
  selectedFile?: File

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  bordereauForm: FormGroup = new FormGroup({
    echeanceId: new FormControl(null, [Validators.required]),
    montant: new FormControl(null, [Validators.required]),
    referenceBancaire: new FormControl(null, []),
  })

  constructor(
    private bordereauService: BordereauService,
    private echeanceService: EcheanceService
  ) {
    super()
    this.getBordereaux()
    this.getEcheances()
  }

  ngOnInit(): void {
  }

  getBordereaux(): void {
    this.bordereauService.getAll().subscribe({
      next: (res) => {
        this.bordereaux = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  getEcheances(): void {
    this.echeanceService.getAll().subscribe({
      next: (res) => {
        this.echeances = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0]
  }

  uploadBordereau(): void {
    this.bordereauForm.markAllAsTouched()
    if (this.bordereauForm.valid && this.selectedFile) {
      const formData = new FormData()
      formData.append('echeanceId', this.bordereauForm.get('echeanceId')!.value)
      formData.append('montant', this.bordereauForm.get('montant')!.value)
      formData.append('referenceBancaire', this.bordereauForm.get('referenceBancaire')!.value ?? '')
      formData.append('fichier', this.selectedFile)

      this.bordereauService.upload(formData).subscribe({
        next: () => {
          this.getBordereaux()
          this.closeUploadBordereauModal()
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  // Modals
  closeUploadBordereauModal(): void {
    this.showUploadBordereauModal = false
    this.bordereauForm.reset()
    this.selectedFile = undefined
  }

  openDetailsBordereauModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.showDetailsBordereauModal = true
  }

  closeDetailsBordereauModal(): void {
    this.showDetailsBordereauModal = false
    this.selectedBordereau = undefined
  }
}
