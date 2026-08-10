import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypesPaiement } from 'src/app/data/enums/TypesPaiement';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionCours } from 'src/app/data/modules/inscription/models/DemandeInscriptionCours.model';
import { PaiementInscription } from 'src/app/data/modules/inscription/models/PaiementInscription.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { PaiementInscriptionService } from 'src/app/data/modules/inscription/services/paiement-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-paiements-section',
  templateUrl: './paiements-section.component.html',
  styleUrls: ['./paiements-section.component.scss']
})
export class PaiementsSectionComponent implements OnInit {

  error: boolean = false
  loading: boolean = false
  errorMessage: string = ''

  @Input() demande!: DemandeInscription
  @Input() coursChoisis?: DemandeInscriptionCours[]
  @Input() rolesValue!: RolesValueType
  @Output() nextStep: EventEmitter<any> = new EventEmitter()

  readonly typesPaiement = TypesPaiement
  session!: Session
  fraisAPayer: any[] = []
  fraisTotal: number = 0

  showPaiementModal: boolean = false
  paiementMontant?: number
  paiementDescription?: string
  paiementError: boolean = false

  constructor(
    private sessionService: SessionService,
    private paiementInscriptionService: PaiementInscriptionService
  ) {
  }

  ngOnInit(): void {
    this.session = this.demande.session!
    this.getFraisInscription()
  }

  // private getSession(id: string) {
  //   this.sessionService.get(id).subscribe({
  //     next: (value) => {
  //       this.session = value
  //       this.getFraisInscription()
  //     },
  //     error: (err) => {
  //       console.log(err)
  //     }
  //   })
  // }

  getFraisInscription(): void {
    this.loading = true
    this.errorMessage = ''

    const fraisInscription = this.session?.fraisInscription
    if (!fraisInscription || !this.coursChoisis) {
      this.loading = false
      if (!fraisInscription) {
        this.errorMessage = 'Aucun frais d\'inscription configuré pour cette session.'
      }
      return
    }

    for (const element of fraisInscription) {
      if (element.fraisDesCours) {
        const fraisDesCours = this.coursChoisis.reduce((accumulator, currentValue) => {
          return accumulator + element.montant * (currentValue.cours?.credit ?? 0)
        }, 0)
        this.fraisAPayer.push({ titre: 'Montant des cours', montant: fraisDesCours })
        this.fraisTotal += fraisDesCours
      }
      else {
        this.fraisTotal += element.montant
        this.fraisAPayer.push({ titre: element.titre, montant: element.montant })
      }
    }
    this.loading = false
  }

  getFraisPayes(): number {
    return this.demande!.paiementsInscription?.reduce((accumulator, currentValue) => {
      return accumulator + (currentValue.montant ?? 0)
    }, 0) as number
  }

  getFichePaiement(): void {
    if (this.demande?.id) {
      window.open(
        `${environment.API_MODULES.INSCRIPTION}/demandesInscription/${this.demande.id}/fiche-paiement`,
        '_blank'
      )
    }
  }

  enregistrerPaiement(): void {
    if (!this.paiementMontant || this.paiementMontant <= 0) {
      this.paiementError = true
      return
    }

    this.paiementError = false
    const paiement: PaiementInscription = new PaiementInscription()
    paiement.montant = this.paiementMontant
    paiement.description = this.paiementDescription || "Paiement en espèces"
    paiement.matriculeInscription = this.demande?.matricule ?? ''
    paiement.datePaiement = new Date()

    this.paiementInscriptionService.create(paiement).subscribe({
      next: (res: any) => {
        if (res?.receiptUrl) {
          window.open(res.receiptUrl, '_blank')
        }
        this.closePaiementModal()
        // Recharger les paiements sans recharger toute la page
        this.demande = { ...this.demande }
        if (this.demande.paiementsInscription) {
          this.demande.paiementsInscription.push(paiement)
        } else {
          this.demande.paiementsInscription = [paiement]
        }
      },
      error: (error) => {
        console.error('Erreur paiement:', error)
        this.paiementError = true
        this.errorMessage = 'Erreur lors de l\'enregistrement du paiement. Veuillez réessayer.'
        setTimeout(() => { this.errorMessage = '' }, 5000)
      }
    })
  }

  closePaiementModal(): void {
    this.showPaiementModal = false
    this.paiementMontant = undefined
    this.paiementDescription = undefined
    this.paiementError = false
  }

}
