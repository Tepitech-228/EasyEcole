import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {

  showModal: boolean = true
  selectedDemande?: DemandeInscription
  demandesInscription: DemandeInscription[] = []

  showNouvelleDemandeModal: boolean = false
  alreadySignUp: boolean = false
  demandeError: boolean = false
  sessions: Session[] = []
  currentSession: number = 0

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(
    private router: Router,
    private demandeInscriptionService: DemandeInscriptionService,
    private sessionService: SessionService) {
    super()
    this.getDemandesInscription()
    this.getSessions()
  }

  ngOnInit(): void {
  }

  getDemandesInscription(): void {
    this.demandeInscriptionService.getAll()
    .subscribe({
      next: (res) => {
        this.demandesInscription = res
        console.log(res)
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  private getSessions(): void {
    this.sessionService.getAll()
    .subscribe({
      next: (res) => {
        this.sessions = res.filter(session => Session.getEtat(session.dateDebut, session.dateFin) == EtatsSession.OUVERTE)
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  faireDemandeInscription(): void {
    if (this.sessions.length === 0) return

    let demandeInscription: DemandeInscription = new DemandeInscription()
    demandeInscription.dateDemande = new Date()
    demandeInscription.sessionId = this.sessions[this.currentSession].id

    this.demandeInscriptionService.create(demandeInscription).subscribe({
      next: (value) => {
        this.router.navigate(['/inscription/demandes/' + value.id])
      },
      error: (err: HttpErrorResponse) => {
        this.showNouvelleDemandeModal = false
        if (err.error?.alreadySignUp == true) {
          this.alreadySignUp = true
          setTimeout(() => { this.alreadySignUp = false }, 3000)
        } else {
          this.demandeError = true
          setTimeout(() => { this.demandeError = false }, 3000)
        }
      }
    })
  }

  tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return DemandeInscription.tauxDeTraitement(parcoursChoisis)
  }

  openModal(demandeInscription: DemandeInscription) {
    this.showModal = true
    this.selectedDemande = demandeInscription
  }
  
  closeModal(): void {
    this.showModal = false
  }

}
