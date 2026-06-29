import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { EtatPreInscription } from 'src/app/data/modules/inscription/models/PreInscription.model';
import { PreInscriptionService } from 'src/app/data/modules/inscription/services/pre-inscription.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';

@Component({
  selector: 'app-pre-inscription-section',
  templateUrl: './pre-inscription-section.component.html',
  styleUrls: ['./pre-inscription-section.component.scss']
})
export class PreInscriptionSectionComponent {

  @Input() demande!: DemandeInscription
  @Input() rolesValue!: RolesValueType
  @Output() nextStep: EventEmitter<void> = new EventEmitter()
  @Output() refresh: EventEmitter<void> = new EventEmitter()

  showSoumettreModal: boolean = false
  erreurSoumission: string = ''

  constructor(private preInscriptionService: PreInscriptionService) {}

  get statut(): EtatPreInscription | undefined {
    return this.demande.preInscription?.statut
  }

  get estEnAttente(): boolean {
    return !this.statut || this.statut == EtatPreInscription.EN_ATTENTE
  }

  get estValidee(): boolean {
    return this.statut == EtatPreInscription.VALIDE
  }

  get estRejetee(): boolean {
    return this.statut == EtatPreInscription.REJETE
  }

  get estPasSoumis(): boolean {
    return !this.statut
  }

  soumettreAuComite(): void {
    this.erreurSoumission = ''
    this.preInscriptionService.soumettre(this.demande.id!)
      .subscribe({
        next: () => {
          this.showSoumettreModal = false
          this.refresh.emit()
        },
        error: (err) => {
          this.erreurSoumission = err.error?.message || 'Une erreur est survenue lors de la soumission'
          console.log(err)
        }
      })
  }

  telechargerAutorisation(): void {
    if (!this.demande.preInscription?.id) return
    this.preInscriptionService.telechargerAutorisation(this.demande.preInscription.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'autorisation_provisoire_inscription.pdf'
          a.click()
          window.URL.revokeObjectURL(url)
        },
        error: (err) => console.log(err)
      })
  }

  continuer(): void {
    this.nextStep.emit()
  }
}
