import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent extends BaseComponentClass implements OnInit {
  
  showNouvelleDemandeModal: boolean = false
  alreadySignUp: boolean = false
  demandeError: boolean = false
  currentSession: number = 0
  sessions: Session[] = []
  readonly etatsSession = EtatsSession

  utilisateur?: Utilisateur
  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly QR_CODES_PATH: string = environment.QR_CODES_PATH

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private demandeInscriptionService: DemandeInscriptionService,
    private utilisateurService: UtilisateurService) {
    super()
    this.getSessions()
    this.getUtilisateur()
  }

  ngOnInit(): void {
  }

  private getSessions(): void {
    this.sessionService.getAll()
    .subscribe(
      {
        next: (res) => {
          console.log(res)
          this.sessions = res.filter(session => this.getEtatSession(session.dateDebut, session.dateFin) == EtatsSession.OUVERTE)
        },
        error: (err) => {
          console.log(err)
        },
      }
    )
  }

  getEtatSession(dateDebut: Date, dateFin: Date): EtatsSession {
    return Session.getEtat(dateDebut, dateFin);
  }

  faireDemandeInscription(): void {
    let demandeInscription: DemandeInscription = new DemandeInscription()
    demandeInscription.dateDemande = new Date()
    demandeInscription.sessionId = this.sessions[this.currentSession].id

    this.demandeInscriptionService.create(demandeInscription).subscribe({
      next: (value) => {
        this.router.navigate(['/inscription/demandes/' + value.id])
      },
      error: (err: HttpErrorResponse) => {
        if(err.error.alreadySignUp == true) {
          this.alreadySignUp = true
          setTimeout(() => {
            this.alreadySignUp = false
          }, 3000);
        }
        else {
          this.demandeError = true
          setTimeout(() => {
            this.demandeError = false
          }, 3000);
        }
      }
    })
  }

  getUtilisateur(): void {
    this.utilisateurService.get().subscribe({
      next: (value) => {
        this.utilisateur = value
      },
      error: (err: HttpErrorResponse) => {
        console.log(err)
      }
    })
  }

}
