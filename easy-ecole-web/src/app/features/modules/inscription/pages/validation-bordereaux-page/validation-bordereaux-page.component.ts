import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-validation-bordereaux-page',
  templateUrl: './validation-bordereaux-page.component.html',
  styleUrls: ['./validation-bordereaux-page.component.scss']
})
export class ValidationBordereauxPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  successMessage: string = ''

  showValidationModal: boolean = false
  showRejetModal: boolean = false

  bordereauxEnAttente: Bordereau[] = []
  selectedBordereau?: Bordereau
  commentaireRejet: string = ''

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  constructor(
    private bordereauService: BordereauService
  ) {
    super()
    this.getBordereauxEnAttente()
  }

  ngOnInit(): void {
  }

  getBordereauxEnAttente(): void {
    this.bordereauService.getAll({ statut: 'en_attente' }).subscribe({
      next: (res) => {
        this.bordereauxEnAttente = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  validerBordereau(): void {
    if (this.selectedBordereau) {
      this.bordereauService.valider(this.selectedBordereau.id!).subscribe({
        next: () => {
          this.successMessage = 'Bordereau validé avec succès'
          this.getBordereauxEnAttente()
          this.closeValidationModal()

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

  rejeterBordereau(): void {
    if (this.selectedBordereau && this.commentaireRejet.trim()) {
      this.bordereauService.rejeter(this.selectedBordereau.id!, this.commentaireRejet).subscribe({
        next: () => {
          this.successMessage = 'Bordereau rejeté'
          this.getBordereauxEnAttente()
          this.closeRejetModal()

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

  // Modals
  openValidationModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.showValidationModal = true
  }

  closeValidationModal(): void {
    this.showValidationModal = false
    this.selectedBordereau = undefined
  }

  openRejetModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.commentaireRejet = ''
    this.showRejetModal = true
  }

  closeRejetModal(): void {
    this.showRejetModal = false
    this.selectedBordereau = undefined
    this.commentaireRejet = ''
  }
}
