import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';

@Component({
  selector: 'app-liste-sessions-page',
  templateUrl: './liste-sessions-page.component.html',
  styleUrls: ['./liste-sessions-page.component.scss']
})
export class ListeSessionsPageComponent  extends BaseComponentClass implements OnInit {

  showNouvelleSessionModal: boolean = false
  TODAY_DATE: string = (new Date()).toISOString().split('T')[0]

  sessions: Session[] = []
  niveauxEtude: NiveauEtude[] = []
  selectedNiveauEtude: string = 'undefined'
  anneesAcademiques: AnneeAcademique[] = []
  selectedAnneeAcademique: string = 'undefined'
  readonly etatsSession = EtatsSession

  sessionForm: FormGroup = new FormGroup({
    dateDebut: new FormControl(this.TODAY_DATE, [Validators.required]),
    dateFin: new FormControl(null, [Validators.required]),
    niveauEtude: new FormControl(null, [Validators.required]),
    anneeAcademique: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor(
    private router: Router,
    private niveauEtudeService: NiveauEtudeService,
    private sessionService: SessionService,
    private anneeAcademiqueService: AnneeAcademiqueService) {
    super()
    if (!this.rolesValue.isInstitution) {
      this.router.navigate(['/'])
    }
    else {
      this.getSessions()
    }
  }

  ngOnInit(): void {
  }

  private getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.niveauxEtude = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  private getAnneesAcademiques(): void {
    this.anneeAcademiqueService.getAll()
    .subscribe(
      {
        next: (res) => {
          this.anneesAcademiques = res
          this.sessionForm.get('anneeAcademique')!.setValue(this.anneesAcademiques[0].id)
        },
        error: (err) => {
          console.log(err)
        },
      }
    )
  }

  private getSessions(): void {
    this.sessionService.getAll()
    .subscribe(
      {
        next: (res) => {
          this.sessions = res
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

  ajouterSession(): void {
    this.sessionForm.markAllAsTouched()
    if(this.sessionForm.valid) {
      let session: Session = new Session()
      session.dateDebut = this.sessionForm.get('dateDebut')!.value ?? new Date()
      session.dateFin = this.sessionForm.get('dateFin')!.value
      session.niveauEtudeId = this.sessionForm.get('niveauEtude')!.value
      session.anneeAcademiqueId = this.sessionForm.get('anneeAcademique')!.value
      session.description = this.sessionForm.get('description')!.value

      this.sessionService.create(session).subscribe({
        next: (res) => {
          // this.getSessions()
          // this.closeNouvelleSessionModal()
            this.router.navigate(['/inscription/sessions/' + res.id])
        },
        error: (err) => {

        },
      })
    }
  }

  // Modals
  openNouvelleSessionModal(): void {
    this.getNiveauxEtude()
    this.getAnneesAcademiques()
    this.TODAY_DATE = (new Date()).toISOString().split('T')[0]
    this.sessionForm.get('dateDebut')!.setValue(this.TODAY_DATE)
    this.showNouvelleSessionModal = true
  }
  closeNouvelleSessionModal(): void {
    this.showNouvelleSessionModal = false
    this.sessionForm.reset()
  }

}
