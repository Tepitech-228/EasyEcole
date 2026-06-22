import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Echeance } from 'src/app/data/modules/inscription/models/Echeance.model';
import { DossierEtudiant } from 'src/app/data/modules/inscription/models/DossierEtudiant.model';
import { EcheanceService } from 'src/app/data/modules/inscription/services/echeance.service';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';

@Component({
  selector: 'app-gestion-echeances-page',
  templateUrl: './gestion-echeances-page.component.html',
  styleUrls: ['./gestion-echeances-page.component.scss']
})
export class GestionEcheancesPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  successMessage: string = ''

  showNouvelleEcheanceModal: boolean = false
  showEditerEcheanceModal: boolean = false
  showGenererEcheancesModal: boolean = false
  showSupprimerEcheanceModal: boolean = false

  echeances: Echeance[] = []
  dossiers: DossierEtudiant[] = []
  selectedEcheance?: Echeance
  selectedDossierId?: string

  echeanceForm: FormGroup = new FormGroup({
    dossierEtudiantId: new FormControl(null, [Validators.required]),
    type: new FormControl('scolarite', [Validators.required]),
    numeroEcheance: new FormControl(null, [Validators.required]),
    montant: new FormControl(null, [Validators.required]),
    dateLimite: new FormControl(null, [Validators.required]),
    moisConcerne: new FormControl(null, []),
  })

  constructor(
    private echeanceService: EcheanceService,
    private dossierEtudiantService: DossierEtudiantService
  ) {
    super()
    this.getEcheances()
    this.getDossiers()
  }

  ngOnInit(): void {
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

  getDossiers(): void {
    this.dossierEtudiantService.getAll().subscribe({
      next: (res) => {
        this.dossiers = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  createEcheance(): void {
    this.echeanceForm.markAllAsTouched()
    if (this.echeanceForm.valid) {
      this.echeanceService.create(this.echeanceForm.value).subscribe({
        next: () => {
          this.successMessage = 'Échéance créée avec succès'
          this.getEcheances()
          this.closeNouvelleEcheanceModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  updateEcheance(): void {
    this.echeanceForm.markAllAsTouched()
    if (this.echeanceForm.valid && this.selectedEcheance) {
      this.echeanceService.update(this.selectedEcheance.id!, this.echeanceForm.value).subscribe({
        next: () => {
          this.successMessage = 'Échéance mise à jour'
          this.getEcheances()
          this.closeEditerEcheanceModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  deleteEcheance(): void {
    if (this.selectedEcheance) {
      this.echeanceService.delete(this.selectedEcheance.id!).subscribe({
        next: () => {
          this.successMessage = 'Échéance supprimée'
          this.getEcheances()
          this.closeSupprimerEcheanceModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  genererEcheances(): void {
    if (this.selectedDossierId) {
      this.echeanceService.generer(this.selectedDossierId).subscribe({
        next: () => {
          this.successMessage = 'Échéances générées automatiquement'
          this.getEcheances()
          this.closeGenererEcheancesModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'paye': return 'green'
      case 'en_retard': return 'red'
      case 'impaye': return 'yellow'
      default: return 'gray'
    }
  }

  // Modals
  openNouvelleEcheanceModal(): void {
    this.echeanceForm.reset()
    this.echeanceForm.get('type')!.setValue('scolarite')
    this.showNouvelleEcheanceModal = true
  }

  closeNouvelleEcheanceModal(): void {
    this.showNouvelleEcheanceModal = false
    this.echeanceForm.reset()
  }

  openEditerEcheanceModal(echeance: Echeance): void {
    this.selectedEcheance = echeance
    this.echeanceForm.get('dossierEtudiantId')!.setValue(echeance.dossierEtudiantId)
    this.echeanceForm.get('type')!.setValue(echeance.type)
    this.echeanceForm.get('numeroEcheance')!.setValue(echeance.numeroEcheance)
    this.echeanceForm.get('montant')!.setValue(echeance.montant)
    this.echeanceForm.get('dateLimite')!.setValue(echeance.dateLimite)
    this.echeanceForm.get('moisConcerne')!.setValue(echeance.moisConcerne)
    this.showEditerEcheanceModal = true
  }

  closeEditerEcheanceModal(): void {
    this.showEditerEcheanceModal = false
    this.echeanceForm.reset()
    this.selectedEcheance = undefined
  }

  openGenererEcheancesModal(): void {
    this.selectedDossierId = undefined
    this.showGenererEcheancesModal = true
  }

  closeGenererEcheancesModal(): void {
    this.showGenererEcheancesModal = false
    this.selectedDossierId = undefined
  }

  openSupprimerEcheanceModal(echeance: Echeance): void {
    this.selectedEcheance = echeance
    this.showSupprimerEcheanceModal = true
  }

  closeSupprimerEcheanceModal(): void {
    this.showSupprimerEcheanceModal = false
    this.selectedEcheance = undefined
  }
}
