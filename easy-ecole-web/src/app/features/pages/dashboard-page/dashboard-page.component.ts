import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { ApprenantService } from 'src/app/data/modules/auth/services/apprenant.service';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { PreInscriptionService } from 'src/app/data/modules/inscription/services/pre-inscription.service';
import { CommunicationService } from 'src/app/data/modules/communication/services/communication.service';
import { Communication } from 'src/app/data/modules/communication/models/Communication.model';
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

  totalUtilisateurs: number = 0
  totalSessions: number = 0
  totalApprenants: number = 0
  totalEnseignants: number = 0
  demandesEnAttente: number = 0
  sessionsOuvertes: number = 0

  currentYear: number = new Date().getFullYear()
  loading: boolean = true
  monthlyData: { month: string; count: number }[] = []
  maxMonthlyCount: number = 1
  recentDemandes: DemandeInscription[] = []
  annoncesRecentes: Communication[] = []
  notesRecentes: any[] = []
  loadingNotes: boolean = true

  constructor(
    private http: HttpClient,
    private router: Router,
    private sessionService: SessionService,
    private demandeInscriptionService: DemandeInscriptionService,
    private utilisateurService: UtilisateurService,
    private apprenantService: ApprenantService,
    private enseignantService: EnseignantService,
    private preInscriptionService: PreInscriptionService,
    private communicationService: CommunicationService) {
    super()
    this.getSessions()
    this.getUtilisateur()
  }

  ngOnInit(): void {
    this.loadDashboardData()
    this.loadRecentNotes()
  }

  private loadDashboardData(): void {
    if (!this.rolesValue.isAdmin) {
      this.loading = false
      return
    }
    forkJoin({
      apprenants: this.apprenantService.getCount().pipe(catchError(() => of({ count: 0 }))),
      enseignants: this.enseignantService.getCount().pipe(catchError(() => of({ count: 0 }))),
      sessions: this.sessionService.getAll().pipe(catchError(() => of([]))),
      demandes: this.demandeInscriptionService.getAll().pipe(catchError(() => of([]))),
      enAttente: this.preInscriptionService.getDemandesEnAttente().pipe(catchError(() => of([]))),
      annonces: this.communicationService.getAll().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        this.totalApprenants = data.apprenants.count
        this.totalEnseignants = data.enseignants.count
        this.totalSessions = data.sessions.length
        this.sessionsOuvertes = data.sessions.filter(s => Session.getEtat(s.dateDebut, s.dateFin) === EtatsSession.OUVERTE).length
        this.demandesEnAttente = data.enAttente.length

        this.processMonthlyData(data.demandes)
        this.processRecentDemandes(data.demandes)
        this.annoncesRecentes = (data.annonces as Communication[]).slice(0, 3)
        this.loading = false
      },
      error: () => this.loading = false,
    })
  }

  private processMonthlyData(demandes: DemandeInscription[]): void {
    const currentYearDemandes = demandes.filter(d => {
      if (!d.dateDemande) return false
      return new Date(d.dateDemande).getFullYear() === this.currentYear
    })

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const monthlyMap = new Map<string, number>()
    monthNames.forEach(m => monthlyMap.set(m, 0))

    currentYearDemandes.forEach(d => {
      const date = new Date(d.dateDemande!)
      const monthIndex = date.getMonth()
      const monthName = monthNames[monthIndex]
      monthlyMap.set(monthName, (monthlyMap.get(monthName) || 0) + 1)
    })

    this.monthlyData = Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count }))
    this.maxMonthlyCount = Math.max(...this.monthlyData.map(d => d.count), 1)
  }

  private processRecentDemandes(demandes: DemandeInscription[]): void {
    this.recentDemandes = demandes
      .filter(d => d.dateDemande)
      .sort((a, b) => new Date(b.dateDemande!).getTime() - new Date(a.dateDemande!).getTime())
      .slice(0, 5)
  }

  private getSessions(): void {
    this.sessionService.getAll()
    .subscribe(
      {
        next: (res) => {
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

  private loadRecentNotes(): void {
    if (!this.rolesValue.isApprenant) { this.loadingNotes = false; return; }
    const url = `${environment.API_MODULES.INSCRIPTION}/publications-notes/mes-notes`;
    this.http.get(url).subscribe({
      next: (data: any) => {
        this.notesRecentes = (Array.isArray(data) ? data : []).slice(0, 3);
        this.loadingNotes = false;
      },
      error: () => this.loadingNotes = false
    });
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
