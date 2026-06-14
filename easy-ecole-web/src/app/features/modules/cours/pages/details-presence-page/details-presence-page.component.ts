import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EtatsDePresence } from 'src/app/data/enums/EtatsDePresence';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CoursParticipant } from 'src/app/data/modules/inscription/models/CoursParticipant.model';
import { ListePresence } from 'src/app/data/modules/inscription/models/ListePresence.model';
import { Presence } from 'src/app/data/modules/inscription/models/Presence.model';
import { PresenceCoursParticipant } from 'src/app/data/modules/inscription/models/PresenceCoursParticipant.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { ListePresenceService } from 'src/app/data/modules/inscription/services/liste-presence.service';
import { PresenceCoursParticipantService } from 'src/app/data/modules/inscription/services/presence-cours-participant.service';
import { PresenceService } from 'src/app/data/modules/inscription/services/presence.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-details-presence-page',
  templateUrl: './details-presence-page.component.html',
  styleUrls: ['./details-presence-page.component.scss']
})
export class DetailsPresencePageComponent extends BaseComponentClass implements OnInit {

  alreadyExists: boolean = false
  error: boolean = false

  id: string
  listePresence?: ListePresence
  coursParticipants: CoursParticipant[] = []

  showNouvellePresenceModal: boolean = false
  showModificationPresenceModal: boolean = false
  showSuppressionPresenceModal: boolean = false

  cours: Cours[] = []
  coursLoading: boolean = false
  enseignants: Enseignant[] = []
  enseignantsLoading: boolean = false
  presences: Presence[] = []
  selectedPresence?: Presence

  readonly etatsDePresence = EtatsDePresence
  readonly etatsDePresenceTextAndColor: { type: EtatsDePresence, text: string, color: string }[] = [
    { type: EtatsDePresence.NON_RENSEIGNE, text: 'Non renseigné', color: 'gray' },
    { type: EtatsDePresence.PRESENT, text: 'Présent', color: 'green' },
    { type: EtatsDePresence.ABSENT, text: 'Absent', color: 'red' },
    { type: EtatsDePresence.ABSENCE_JUSTIFIEE, text: 'Absence justifiée', color: 'yellow' },
  ]

  nouvellePresenceForm: FormGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    participants: new FormArray([])
  })
  get participantsControls(): FormArray {
    return this.nouvellePresenceForm.get('participants') as FormArray
  }

  modificationPresenceForm: FormGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
  })

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(
    private listePresenceService: ListePresenceService,
    private coursService: CoursService,
    private enseignantService: EnseignantService,
    private presenceService: PresenceService,
    private presenceCoursParticipantService: PresenceCoursParticipantService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getListePresence()
  }

  ngOnInit(): void {
  }

  getListePresence(): void {
    this.listePresenceService.get(this.id)
      .subscribe(
        {
          next: (res) => {
            this.listePresence = res
            this.presences = this.listePresence.presences ?? []

            if(res.cours) {
              this.getParticipants(res.cours.id!)
            }
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404 || err.status == 403) {
              this.router.navigate(['/cours/presences'])
            }
          },
        }
      )
  }

  getParticipants(coursId: string): void {
    this.coursService.getParticipants(coursId)
      .subscribe(
        {
          next: (res) => {
            console.log(res)
            this.coursParticipants = res
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
          },
        }
      )
  }

  getCours(): void {
    this.coursLoading = true

    this.coursService.getAll()
      .subscribe({
        next: (res) => {
          this.cours = res
        },
        error: (err) => {
          console.log(err)
        },
        complete: () => {
          this.coursLoading = false
        }
      })
  }

  getEnseignants(): void {
    this.enseignantsLoading = true

    this.enseignantService.getAll()
      .subscribe({
        next: (res) => {
          this.enseignants = res
        },
        error: (err) => {
          console.log(err)
        },
        complete: () => {
          this.enseignantsLoading = false
        }
      })
  }

  customCoursSearchFn(term: string, item: Cours) {
    term = term.toLowerCase();
    return item.intitule!.toLowerCase().indexOf(term) > -1 || item.code!.toLowerCase().indexOf(term) > -1;
  }

  customEnseignantSearchFn(term: string, item: Enseignant) {
    term = term.toLowerCase();
    return item.utilisateur!.nom!.toLowerCase().indexOf(term) > -1 || item.utilisateur!.prenoms!.toLowerCase().indexOf(term) > -1;
  }

  onCoursChange(event: Cours, modification: boolean = false): void {
    // console.log(event)
    if (event) {
      this.getParticipants(event.id!)
    }
  }

  getEtatPresence(presenceIndex: number, coursParticipantId: string): EtatsDePresence {
    // console.log('Etat presence:', presenceIndex, coursParticipantId)
    const presenceCoursParticipant: PresenceCoursParticipant | undefined = this.presences[presenceIndex].presencesCoursParticipants?.find((value: PresenceCoursParticipant) => value.coursParticipantId == coursParticipantId)

    if (presenceCoursParticipant && presenceCoursParticipant.etatDePresence) {
      return presenceCoursParticipant.etatDePresence
    }

    return EtatsDePresence.NON_RENSEIGNE
  }

  ajouterPresence(): void {
    console.log(this.nouvellePresenceForm.valid, this.nouvellePresenceForm.value)
    this.nouvellePresenceForm.markAllAsTouched()
    if (this.nouvellePresenceForm.valid) {
      let presence: Presence = new Presence()
      presence.date = this.nouvellePresenceForm.get('date')!.value
      presence.heureDebut = this.nouvellePresenceForm.get('heureDebut')!.value
      presence.heureFin = this.nouvellePresenceForm.get('heureFin')!.value
      presence.listePresenceId = this.id

      this.presenceService.create(presence).subscribe({
        next: (res) => {
          const participants = this.nouvellePresenceForm.get('participants')!.value ?? []

          for (let index = 0; index < participants.length; index++) {
            const participant = participants[index];
            let presenceCoursParticipant: PresenceCoursParticipant = new PresenceCoursParticipant()
            presenceCoursParticipant.coursParticipantId = participant.coursParticipant
            presenceCoursParticipant.etatDePresence = participant.etatDePresence
            presenceCoursParticipant.presenceId = res.id

            this.presenceCoursParticipantService.create(presenceCoursParticipant)
              .subscribe({
                next: (res) => {
                  if (index == participants.length - 1) {
                    this.getListePresence()
                    this.closeNouvellePresenceModal()
                  }
                },
                error: (err) => {
                  console.log(err)
                },
              })
          }
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
  }

  // Modals
  openNouvellePresenceModal(): void {
    this.getCours()
    this.getEnseignants()

    const particantsFormArray = this.nouvellePresenceForm.get('participants') as FormArray;
    if (!particantsFormArray.invalid) {
      for (let index = 0; index < this.coursParticipants.length; index++) {
        const coursParticipant = this.coursParticipants[index];
        particantsFormArray.push(
          new FormGroup({
            coursParticipant: new FormControl(coursParticipant.id, [Validators.required]),
            utilisateur: new FormControl(coursParticipant.utilisateur, [Validators.required]),
            etatDePresence: new FormControl(EtatsDePresence.NON_RENSEIGNE, [Validators.required])
          })
        )
      }
    }

    this.showNouvellePresenceModal = true
  }

  closeNouvellePresenceModal(): void {
    this.showNouvellePresenceModal = false
    this.nouvellePresenceForm.reset();
    (this.nouvellePresenceForm.get('participants') as FormArray).clear()
  }

  openModificationPresenceModal(arg: any): void {
    console.log(arg);
    const presenceIndex = arg.event.extendedProps.index
    this.selectedPresence = this.presences[presenceIndex]

    if (this.selectedPresence) {
      this.modificationPresenceForm.get('date')!.setValue(this.selectedPresence.date)
      this.modificationPresenceForm.get('heureDebut')!.setValue(this.selectedPresence.heureDebut)
      this.modificationPresenceForm.get('heureFin')!.setValue(this.selectedPresence.heureFin)

      this.showModificationPresenceModal = true
    }
  }

  closeModificationPresenceModal(): void {
    this.modificationPresenceForm.reset()
    this.showModificationPresenceModal = false
  }

  openSuppressionPresenceModal(arg: any): void {
    console.log(arg);
    const presenceIndex = arg.event.extendedProps.index
    this.selectedPresence = this.presences[presenceIndex]

    if (this.selectedPresence) {
      this.showSuppressionPresenceModal = true
    }
  }

  closeSuppressionPresenceModal(): void {
    this.showSuppressionPresenceModal = false
  }
}
