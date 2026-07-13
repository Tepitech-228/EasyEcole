import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { TypesPaiement } from 'src/app/data/enums/TypesPaiement';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { PaiementInscription } from 'src/app/data/modules/inscription/models/PaiementInscription.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { PaiementInscriptionService } from 'src/app/data/modules/inscription/services/paiement-inscription.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-paiements-page',
  templateUrl: './paiements-page.component.html',
  styleUrls: ['./paiements-page.component.scss']
})
export class PaiementsPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  matriculeNotExists: boolean = false

  showNouveauPaiementModal: boolean = false
  showDetailsPaiementModal: boolean = false
  showEditerPaiementModal: boolean = false
  showSupprimerPaiementModal: boolean = false
  
  demandeInscription?: DemandeInscription
  paiementsInscription: PaiementInscription[] = []
  selectedPaiement?: PaiementInscription
  readonly typesPaiement = TypesPaiement

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  paiementForm: FormGroup = new FormGroup({
    montant: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
    matriculeInscription: new FormControl(null, [Validators.required]),
  })

  constructor(
    private paiementInscriptionService: PaiementInscriptionService,
    private demandeInscriptionService: DemandeInscriptionService) {
    super()
    this.getPaiements()
  }

  ngOnInit(): void {
  }

  getPaiements(): void {
    this.paiementInscriptionService.getAll().subscribe({
      next: (res) => {
        this.paiementsInscription = res
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

  getDemandeInscription(matricule: string): void {
    this.demandeInscriptionService.getFromPaiement(matricule).subscribe({
      next: (res) => {
        this.demandeInscription = res
        console.log(res)
      },
      error: (err) => {
        console.log(err)
        this.demandeInscription = undefined
        this.matriculeNotExists = true

        setTimeout(() => {
          this.error = false
          this.matriculeNotExists = false
        }, 3000)
      }
    })
  }

  ajouterPaiement(): void {
    console.log(this.paiementForm.value)
    this.paiementForm.markAllAsTouched()
    if (this.paiementForm.valid) {
      let paiement: PaiementInscription = new PaiementInscription()
      paiement.datePaiement = new Date()
      paiement.montant = this.paiementForm.get('montant')!.value
      paiement.description = this.paiementForm.get('description')!.value
      paiement.matriculeInscription = this.paiementForm.get('matriculeInscription')!.value

      this.paiementInscriptionService.create(paiement).subscribe({
        next: () => {
          this.getPaiements()
          this.closeNouveauPaiementModal()
        },
        error: (err) => {
          console.log(err)

          this.matriculeNotExists = err.error.matriculeNotExists
          if (!this.matriculeNotExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.matriculeNotExists = false
          }, 3000)
        }
      })
    }
  }

  modifierPaiement(): void {
    console.log(this.paiementForm.value)
    this.paiementForm.markAllAsTouched()
    if (this.paiementForm.valid && this.selectedPaiement) {
      let paiement: PaiementInscription = new PaiementInscription()
      paiement.id = this.selectedPaiement.id
      paiement.montant = this.paiementForm.get('montant')!.value
      paiement.description = this.paiementForm.get('description')!.value
      paiement.matriculeInscription = this.paiementForm.get('matriculeInscription')!.value

      this.paiementInscriptionService.update(paiement).subscribe({
        next: (res) => {
          this.closeEditerPaiementModal()
        },
        error: (err) => {
          console.log(err)

          setTimeout(() => {
            this.error = false
          }, 3000)
        }
      })
    }
  }

  supprimerPaiement(): void {
    if (this.selectedPaiement) {
      this.paiementInscriptionService.delete(this.selectedPaiement.id!).subscribe({
        next: (res) => {
          this.closeSupprimerPaiementModal()
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
  closeNouveauPaiementModal(): void {
    this.showNouveauPaiementModal = false
    this.paiementForm.reset()
    this.demandeInscription = undefined
  }

  openDetailsPaiementModal(paiement: PaiementInscription): void {
    this.selectedPaiement = paiement
    this.getDemandeInscription(paiement.matriculeInscription!)
    this.showDetailsPaiementModal = true
  }

  closeDetailsPaiementModal(): void {
    this.showDetailsPaiementModal = false
    this.demandeInscription = undefined
    this.selectedPaiement = undefined
  }

  openEditerPaiementModal(paiement: PaiementInscription): void {
    this.selectedPaiement = paiement
    this.getDemandeInscription(paiement.matriculeInscription!)

    this.paiementForm.get('montant')!.setValue(this.selectedPaiement?.montant)
    this.paiementForm.get('description')!.setValue(this.selectedPaiement?.description)
    this.paiementForm.get('matriculeInscription')!.setValue(this.selectedPaiement?.matriculeInscription)

    this.showEditerPaiementModal = true
  }

  closeEditerPaiementModal(): void {
    this.showEditerPaiementModal = false
    this.paiementForm.reset()
    this.selectedPaiement = undefined
  }

  openSupprimerPaiementModal(paiement: PaiementInscription): void {
    this.selectedPaiement = paiement
    this.showSupprimerPaiementModal = true
  }

  closeSupprimerPaiementModal(): void {
    this.showSupprimerPaiementModal = false
    this.selectedPaiement = undefined
  }

}
