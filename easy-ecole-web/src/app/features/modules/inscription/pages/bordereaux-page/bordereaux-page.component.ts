import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { Echeance } from 'src/app/data/modules/inscription/models/Echeance.model';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { EcheanceService } from 'src/app/data/modules/inscription/services/echeance.service';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
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
  showPdfModal: boolean = false

  bordereaux: Bordereau[] = []
  echeances: Echeance[] = []
  sessionMonths: { value: string; label: string }[] = []
  demande: DemandeInscription | null = null
  selectedBordereau?: Bordereau
  selectedFile?: File
  pdfBordereau?: Bordereau

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  bordereauForm: FormGroup = new FormGroup({
    echeanceId: new FormControl(null, []),
    type: new FormControl(null, [Validators.required]),
    montant: new FormControl(null, [Validators.required]),
    referenceBancaire: new FormControl(null, []),
  })

  constructor(
    private bordereauService: BordereauService,
    private echeanceService: EcheanceService,
    private demandeInscriptionService: DemandeInscriptionService,
    private sanitizer: DomSanitizer,
  ) {
    super()
    this.getBordereaux()
    this.getEcheances()
    this.getDemande()
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

  getDemande(): void {
    this.demandeInscriptionService.getAll().subscribe({
      next: (res) => {
        if (res.length > 0) {
          this.demande = res[0]
          if (this.demande.session) {
            this.generateMonthsFromSession(this.demande.session)
          }
        }
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  generateMonthsFromSession(session: Session): void {
    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    const debut = new Date(session.dateDebut)
    const fin = new Date(session.dateFin)
    const current = new Date(debut.getFullYear(), debut.getMonth(), 1)

    this.sessionMonths = []
    while (current <= fin) {
      const value = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0')
      const label = moisNoms[current.getMonth()] + ' ' + current.getFullYear()
      this.sessionMonths.push({ value, label })
      current.setMonth(current.getMonth() + 1)
    }
  }

  onTypeChange(): void {
    const type = this.bordereauForm.get('type')!.value
    const echeanceControl = this.bordereauForm.get('echeanceId')

    if (type === 'inscription') {
      echeanceControl!.clearValidators()
      echeanceControl!.setValue(null)
    } else if (type === 'scolarite') {
      echeanceControl!.setValidators([Validators.required])
    }
    echeanceControl!.updateValueAndValidity()
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0]
  }

  onMonthChange(): void {
    const monthValue = this.bordereauForm.get('echeanceId')!.value
    if (monthValue) {
      const month = this.sessionMonths.find(m => m.value === monthValue)
      if (month) {
        this.bordereauForm.get('montant')!.setValue(null)
      }
    }
  }

  uploadBordereau(): void {
    this.bordereauForm.markAllAsTouched()
    if (this.bordereauForm.valid && this.selectedFile) {
      const type = this.bordereauForm.get('type')!.value
      const formData = new FormData()
      formData.append('type', type)
      formData.append('montant', this.bordereauForm.get('montant')!.value)
      formData.append('referenceBancaire', this.bordereauForm.get('referenceBancaire')!.value ?? '')
      formData.append('fichier', this.selectedFile)

      if (type === 'scolarite') {
        formData.append('echeanceId', this.bordereauForm.get('echeanceId')!.value)
      }

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

  isImageFile(fichier: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fichier)
  }

  getDocUrl(fichier: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.BORDEREAUX_PATH + fichier)
  }

  openPdfModal(bordereau: Bordereau): void {
    this.pdfBordereau = bordereau
    this.showPdfModal = true
  }

  closePdfModal(): void {
    this.showPdfModal = false
    this.pdfBordereau = undefined
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
