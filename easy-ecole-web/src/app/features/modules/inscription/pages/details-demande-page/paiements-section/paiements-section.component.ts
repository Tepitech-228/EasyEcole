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

  @Input() demande!: DemandeInscription
  @Input() coursChoisis?: DemandeInscriptionCours[]
  @Input() rolesValue!: RolesValueType

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
    this.session.fraisInscription!.forEach(element => {
      if (element.fraisDesCours) {
        const fraisDesCours = this.coursChoisis!.reduce((accumulator, currentValue) => {
          // console.log(currentValue.intitule + ': ' + element.montant * (currentValue.credit ?? 0) + ' FCFA')
          return accumulator + element.montant * (currentValue.cours!.credit ?? 0)
        }, 0)
        this.fraisAPayer.push({ titre: 'Montant des cours', montant: fraisDesCours })
        this.fraisTotal += fraisDesCours
      }
      else {
        this.fraisTotal += element.montant
        // console.log(element.titre + ': ' + element.montant + ' FCFA')
        this.fraisAPayer.push({ titre: element.titre, montant: element.montant })
      }
    })
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
    let paiement: PaiementInscription = new PaiementInscription()
    paiement.montant = this.paiementMontant
    paiement.description = this.paiementDescription || "Paiement en espèces"
    paiement.matriculeInscription = this.demande!.matricule!
    paiement.datePaiement = new Date()

    this.paiementInscriptionService.create(paiement).subscribe({
      next: (value) => {
        this.closePaiementModal()
        window.location.reload()
      },
      error: (error) => {
        console.log(error)
      }
    })
  }

  closePaiementModal(): void {
    this.showPaiementModal = false
    this.paiementMontant = undefined
    this.paiementDescription = undefined
    this.paiementError = false
  }

  paiementMobileMoney(): void {
    let paiement: PaiementInscription = new PaiementInscription()
    paiement.datePaiement = new Date()
    paiement.montant = this.fraisTotal
    paiement.description = "Easy Ecole - Paiement des frais d'inscription"
    paiement.matriculeInscription = this.demande!.matricule!

    this.paiementInscriptionService.createMobileMoney(paiement).subscribe({
      next: (value) => {
        window.open(value.data.payment_url, '_blank', 'noopener, noreferrer');
      },
      error: (error) => {
        console.log(error)
      }
    })
  }

}
