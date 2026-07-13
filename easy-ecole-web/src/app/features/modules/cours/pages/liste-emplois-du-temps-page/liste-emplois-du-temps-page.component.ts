import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import allLocales from '@fullcalendar/core/locales-all';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { JoursSemaine } from 'src/app/data/enums/JoursSemaine';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { ConflitSeance, PlanningEvent, Seance } from 'src/app/data/modules/inscription/models/Seance.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { NotificationService } from 'src/app/data/modules/elearning/services/notification.service';

const COULEURS_PALETTE = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#d946ef', '#0ea5e9', '#e11d48', '#65a30d',
];

@Component({
  selector: 'app-liste-emplois-du-temps-page',
  templateUrl: './liste-emplois-du-temps-page.component.html',
  styleUrls: ['./liste-emplois-du-temps-page.component.scss']
})
export class ListeEmploisDuTempsPageComponent extends BaseComponentClass implements OnInit, AfterViewInit {

  alreadyExists: boolean = false
  error: boolean = false

  calendarOptions?: CalendarOptions
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  showNouvelleSeanceModal: boolean = false
  showModificationSeanceModal: boolean = false
  showSuppressionSeanceModal: boolean = false
  readonly joursSemaine = JoursSemaine

  cours: Cours[] = []
  coursLoading: boolean = false
  enseignants: Enseignant[] = []
  enseignantsLoading: boolean = false
  classes: Classe[] = []
  classesLoading: boolean = false
  seances: Seance[] = []
  selectedSeance?: Seance
  currentWeekStart: string = ''
  currentWeekEnd: string = ''
  couleurCoursMap: Record<string, string> = {}

  filterEnseignantId: string = ''
  filterClasseId: string = ''

  conflits: ConflitSeance[] = []
  showConflits: boolean = false
  conflitModeCreation: boolean = false
  forceSave: boolean = false

  publierLoading: boolean = false
  showPublierSuccess: boolean = false
  publierMessage: string = ''

  joursSemaineList = [
    { value: JoursSemaine.LUNDI, label: 'Lundi' },
    { value: JoursSemaine.MARDI, label: 'Mardi' },
    { value: JoursSemaine.MERCREDI, label: 'Mercredi' },
    { value: JoursSemaine.JEUDI, label: 'Jeudi' },
    { value: JoursSemaine.VENDREDI, label: 'Vendredi' },
    { value: JoursSemaine.SAMEDI, label: 'Samedi' },
  ]

  nouvelleSeanceForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    jourSemaine: new FormControl(null, [Validators.required]),
    salle: new FormControl(null, [Validators.required]),
    dateDebut: new FormControl(null, [Validators.required]),
    dateFin: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    cours: new FormControl(null, []),
    description: new FormControl(null, []),
    enseignant: new FormControl(null, []),
    choisirParmiLesCours: new FormControl(true, [Validators.required]),
  })

  modificationSeanceForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    jourSemaine: new FormControl(null, [Validators.required]),
    salle: new FormControl(null, [Validators.required]),
    dateDebut: new FormControl(null, [Validators.required]),
    dateFin: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    cours: new FormControl(null, []),
    description: new FormControl(null, []),
    enseignant: new FormControl(null, []),
    choisirParmiLesCours: new FormControl(true, [Validators.required]),
  })

  constructor(
    private seanceService: SeanceService,
    private coursService: CoursService,
    private enseignantService: EnseignantService,
    private classeService: ClasseService,
    private notificationService: NotificationService,
  ) {
    super()
    this.calendarOptions = {
      initialView: 'timeGridWeek',
      timeZone: 'UTC',
      headerToolbar: false,
      allDaySlot: false,
      plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
      dateClick: (arg) => this.handleDateClick(arg),
      eventClick: (arg) => this.handleEventClick(arg),
      locale: 'fr',
      locales: allLocales,
      nowIndicator: true,
      firstDay: 1,
      titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        omitZeroMinute: false,
        meridiem: 'short'
      },
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      slotDuration: '00:15:00',
      dayMaxEvents: true,
      expandRows: true,
      contentHeight: 800,
      eventBorderColor: 'transparent',
    };
  }

  ngOnInit(): void {
    this.getCours()
    this.getEnseignants()
    this.getClasses()
    this.loadPlanningForCurrentWeek()
  }

  ngAfterViewInit(): void {
  }

  getWeekRange(date: Date): { start: string, end: string } {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(date.setDate(diff))
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  loadPlanningForCurrentWeek(): void {
    const range = this.getWeekRange(new Date())
    this.currentWeekStart = range.start
    this.currentWeekEnd = range.end
    this.loadPlanning(range.start, range.end)
  }

  getCouleurCours(coursId: string): string {
    if (!coursId) return '#3b82f6'
    if (this.couleurCoursMap[coursId]) return this.couleurCoursMap[coursId]
    const index = Object.keys(this.couleurCoursMap).length % COULEURS_PALETTE.length
    this.couleurCoursMap[coursId] = COULEURS_PALETTE[index]
    return this.couleurCoursMap[coursId]
  }

  loadPlanning(semaineDebut: string, semaineFin: string): void {
    const enseignantId = this.filterEnseignantId || undefined
    const classeId = this.filterClasseId || undefined
    this.seanceService.getPlanning(semaineDebut, semaineFin, enseignantId, classeId)
      .subscribe({
        next: (events) => {
          const calendarEvents: EventInput[] = events.map((event: PlanningEvent, index: number) => {
            const couleur = this.getCouleurCours(event.coursId || '')
            return {
              id: event.id,
              title: event.titre,
              start: event.date + "T" + event.heureDebut?.toString(),
              end: event.date + "T" + event.heureFin?.toString(),
              backgroundColor: couleur + '20',
              borderColor: couleur,
              textColor: couleur,
              extendedProps: {
                seanceId: event.seanceId,
                index: index,
                description: event.description,
                salle: event.salle,
                startTime: event.heureDebut?.toString().split(':')[0] + ':' + event.heureDebut?.toString().split(':')[1],
                endTime: event.heureFin?.toString().split(':')[0] + ':' + event.heureFin?.toString().split(':')[1],
                enseignant: event.enseignant?.utilisateur?.nom + ' ' + event.enseignant?.utilisateur?.prenoms,
                cours: event.cours,
                couleur: couleur,
              },
            }
          })

          const calendarApi = this.calendarComponent?.getApi()
          if (calendarApi) {
            calendarApi.removeAllEvents()
            calendarApi.addEventSource(calendarEvents)
          } else if (this.calendarOptions) {
            this.calendarOptions.events = calendarEvents
          }
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  onFilterChange(): void {
    if (this.currentWeekStart && this.currentWeekEnd) {
      this.loadPlanning(this.currentWeekStart, this.currentWeekEnd)
    }
  }

  handleDateClick(arg: any) {
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) return

    const dateStr = arg.dateStr || ''
    const parts = dateStr.split('T')
    const clickedDate = parts[0]
    const timePart = parts[1] || ''

    if (clickedDate) {
      this.nouvelleSeanceForm.get('dateDebut')!.setValue(clickedDate)
    }
    if (timePart) {
      this.nouvelleSeanceForm.get('heureDebut')!.setValue(timePart.split('Z')[0].slice(0, 5))
    }
    if (clickedDate) {
      const dayOfWeek = (new Date(clickedDate).getDay() + 6) % 7 + 1
      const jourMap: Record<number, string> = {
        1: JoursSemaine.LUNDI, 2: JoursSemaine.MARDI, 3: JoursSemaine.MERCREDI,
        4: JoursSemaine.JEUDI, 5: JoursSemaine.VENDREDI, 6: JoursSemaine.SAMEDI,
        7: JoursSemaine.DIMANCHE
      }
      this.nouvelleSeanceForm.get('jourSemaine')!.setValue(jourMap[dayOfWeek])
    }
    this.openNouvelleSeanceModal()
  }

  handleEventClick(clickInfo: any) {
    if (this.rolesValue.isInstitution || this.rolesValue.isAdmin) {
      this.openModificationSeanceModal(clickInfo)
    }
  }

  prevDate(): void {
    let calendarApi = this.calendarComponent.getApi();
    calendarApi.prev();
    const range = this.getWeekRange(calendarApi.getDate())
    this.currentWeekStart = range.start
    this.currentWeekEnd = range.end
    this.loadPlanning(range.start, range.end)
  }

  nextDate(): void {
    let calendarApi = this.calendarComponent.getApi();
    calendarApi.next();
    const range = this.getWeekRange(calendarApi.getDate())
    this.currentWeekStart = range.start
    this.currentWeekEnd = range.end
    this.loadPlanning(range.start, range.end)
  }

  onDateChange(event: any): void {
    let calendarApi = this.calendarComponent.getApi();
    calendarApi.gotoDate(event.target.value);
    const range = this.getWeekRange(calendarApi.getDate())
    this.currentWeekStart = range.start
    this.currentWeekEnd = range.end
    this.loadPlanning(range.start, range.end)
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

  getClasses(): void {
    this.classesLoading = true

    this.classeService.getAll()
      .subscribe({
        next: (res) => {
          this.classes = res
        },
        error: (err) => {
          console.log(err)
        },
        complete: () => {
          this.classesLoading = false
        }
      })
  }

  getSeances(): void {
    this.seanceService.getAll()
      .subscribe({
        next: (res) => {
          this.seances = res
        },
        error: (err) => {
          console.log(err)
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
    if (event) {
      if (!modification) {
        this.nouvelleSeanceForm.get('titre')!.setValue(event.code)
        this.nouvelleSeanceForm.get('description')!.setValue(event.intitule)
        this.nouvelleSeanceForm.get('enseignant')!.setValue(event.enseignantId)
      }
      else {
        this.modificationSeanceForm.get('titre')!.setValue(event.code)
        this.modificationSeanceForm.get('description')!.setValue(event.intitule)
        this.modificationSeanceForm.get('enseignant')!.setValue(event.enseignantId)
      }
    }
  }

  private collectFormData(form: FormGroup): any {
    return {
      titre: form.get('titre')!.value,
      jourSemaine: form.get('jourSemaine')!.value,
      salle: form.get('salle')!.value,
      dateDebut: form.get('dateDebut')!.value,
      dateFin: form.get('dateFin')!.value,
      heureDebut: form.get('heureDebut')!.value,
      heureFin: form.get('heureFin')!.value,
      description: form.get('description')!.value,
      coursId: form.get('cours')!.value,
      enseignantId: form.get('enseignant')!.value,
    }
  }

  verifierConflitsAvantCreation(): void {
    this.nouvelleSeanceForm.markAllAsTouched()
    if (!this.nouvelleSeanceForm.valid) return
    this.conflits = []
    this.showConflits = false
    this.forceSave = false
    const data = this.collectFormData(this.nouvelleSeanceForm)

    this.seanceService.checkConflits(data).subscribe({
      next: (conflits) => {
        if (conflits.length > 0) {
          this.conflits = conflits
          this.showConflits = true
          this.conflitModeCreation = true
        } else {
          this.ajouterSeance()
        }
      },
      error: () => {
        this.ajouterSeance()
      }
    })
  }

  verifierConflitsAvantModification(): void {
    this.modificationSeanceForm.markAllAsTouched()
    if (!this.modificationSeanceForm.valid || !this.selectedSeance) return
    this.conflits = []
    this.showConflits = false
    this.forceSave = false
    const data = { ...this.collectFormData(this.modificationSeanceForm), excludeId: this.selectedSeance.id }

    this.seanceService.checkConflits(data).subscribe({
      next: (conflits) => {
        if (conflits.length > 0) {
          this.conflits = conflits
          this.showConflits = true
          this.conflitModeCreation = false
        } else {
          this.modifierSeance()
        }
      },
      error: () => {
        this.modifierSeance()
      }
    })
  }

  forcerSauvegarde(): void {
    if (this.conflitModeCreation) {
      this.ajouterSeance()
    } else {
      this.modifierSeance()
    }
    this.showConflits = false
    this.conflits = []
  }

  ajouterSeance(): void {
    let seance: Seance = new Seance()
    seance.titre = this.nouvelleSeanceForm.get('titre')!.value
    seance.jourSemaine = this.nouvelleSeanceForm.get('jourSemaine')!.value
    seance.salle = this.nouvelleSeanceForm.get('salle')!.value
    seance.dateDebut = this.nouvelleSeanceForm.get('dateDebut')!.value
    seance.dateFin = this.nouvelleSeanceForm.get('dateFin')!.value
    seance.heureDebut = this.nouvelleSeanceForm.get('heureDebut')!.value
    seance.heureFin = this.nouvelleSeanceForm.get('heureFin')!.value
    seance.description = this.nouvelleSeanceForm.get('description')!.value
    seance.coursId = this.nouvelleSeanceForm.get('cours')!.value
    seance.enseignantId = this.nouvelleSeanceForm.get('enseignant')!.value

    this.seanceService.create(seance).subscribe({
      next: (res) => {
        this.loadPlanning(this.currentWeekStart, this.currentWeekEnd)
        this.closeNouvelleSeanceModal()
      },
      error: (err) => {
        if (err.status === 409) {
          this.conflits = err.error?.conflits || []
          this.showConflits = true
          this.conflitModeCreation = true
        } else {
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }
          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      }
    })
  }

  modifierSeance(): void {
    if (this.selectedSeance) {
      let seance: Seance = new Seance()
      seance.id = this.selectedSeance.id
      seance.titre = this.modificationSeanceForm.get('titre')!.value
      seance.jourSemaine = this.modificationSeanceForm.get('jourSemaine')!.value
      seance.salle = this.modificationSeanceForm.get('salle')!.value
      seance.dateDebut = this.modificationSeanceForm.get('dateDebut')!.value
      seance.dateFin = this.modificationSeanceForm.get('dateFin')!.value
      seance.heureDebut = this.modificationSeanceForm.get('heureDebut')!.value
      seance.heureFin = this.modificationSeanceForm.get('heureFin')!.value
      seance.description = this.modificationSeanceForm.get('description')!.value
      seance.coursId = this.modificationSeanceForm.get('cours')!.value
      seance.enseignantId = this.modificationSeanceForm.get('enseignant')!.value

      this.seanceService.update(seance).subscribe({
        next: (res) => {
          this.loadPlanning(this.currentWeekStart, this.currentWeekEnd)
          this.closeModificationSeanceModal()
        },
        error: (err) => {
          if (err.status === 409) {
            this.conflits = err.error?.conflits || []
            this.showConflits = true
            this.conflitModeCreation = false
          } else {
            this.alreadyExists = err.error.alreadyExists
            if (!this.alreadyExists) {
              this.error = true
            }
            setTimeout(() => {
              this.error = false
              this.alreadyExists = false
            }, 3000)
          }
        }
      })
    }
  }

  supprimerSeance(): void {
    if (this.selectedSeance) {
      this.seanceService.delete(this.selectedSeance.id!).subscribe({
        next: (res) => {
          this.loadPlanning(this.currentWeekStart, this.currentWeekEnd)
          this.closeSuppressionSeanceModal()
        },
        error: (err) => {
          console.log(err)
          this.error = true

          setTimeout(() => {
            this.error = false
          }, 3000)
        }
      })
    }
  }

  publierEmploiDuTemps(): void {
    this.publierLoading = true;
    this.showPublierSuccess = false;
    this.notificationService.publierEmploiDuTemps().subscribe({
      next: (res) => {
        this.publierLoading = false;
        this.showPublierSuccess = true;
        this.publierMessage = `Emploi du temps publié ! ${res.enseignantsNotifies} enseignant(s) et ${res.etudiantsNotifies} étudiant(s) notifié(s).`;
        setTimeout(() => this.showPublierSuccess = false, 5000);
      },
      error: (err) => {
        this.publierLoading = false;
        this.showPublierSuccess = true;
        this.publierMessage = 'Erreur lors de la publication.';
        setTimeout(() => this.showPublierSuccess = false, 5000);
      }
    });
  }

  // Modals
  openNouvelleSeanceModal(): void {
    this.showConflits = false
    this.conflits = []
    this.showNouvelleSeanceModal = true
  }

  closeNouvelleSeanceModal(): void {
    this.nouvelleSeanceForm.reset()
    this.nouvelleSeanceForm.get('choisirParmiLesCours')!.setValue(true)
    this.showNouvelleSeanceModal = false
    this.showConflits = false
    this.conflits = []
  }

  openModificationSeanceModal(arg: any): void {
    const seanceId = arg.event.extendedProps['seanceId']

    if (seanceId) {
      this.seanceService.get(seanceId).subscribe({
        next: (seance) => {
          this.selectedSeance = seance
          this.modificationSeanceForm.get('titre')!.setValue(seance.titre)
          this.modificationSeanceForm.get('jourSemaine')!.setValue(seance.jourSemaine)
          this.modificationSeanceForm.get('salle')!.setValue(seance.salle)
          this.modificationSeanceForm.get('dateDebut')!.setValue(seance.dateDebut)
          this.modificationSeanceForm.get('dateFin')!.setValue(seance.dateFin)
          this.modificationSeanceForm.get('heureDebut')!.setValue(seance.heureDebut)
          this.modificationSeanceForm.get('heureFin')!.setValue(seance.heureFin)
          this.modificationSeanceForm.get('description')!.setValue(seance.description)
          this.modificationSeanceForm.get('cours')!.setValue(seance.coursId)
          this.modificationSeanceForm.get('enseignant')!.setValue(seance.enseignantId)

          this.showConflits = false
          this.conflits = []
          this.showModificationSeanceModal = true
        },
        error: (err) => {
          console.log(err)
        }
      })
    }
  }

  closeModificationSeanceModal(): void {
    this.modificationSeanceForm.reset()
    this.modificationSeanceForm.get('choisirParmiLesCours')!.setValue(true)
    this.showModificationSeanceModal = false
    this.showConflits = false
    this.conflits = []
  }

  openSuppressionSeanceModal(arg: any): void {
    const seanceId = arg.event.extendedProps['seanceId']

    if (seanceId) {
      this.seanceService.get(seanceId).subscribe({
        next: (seance) => {
          this.selectedSeance = seance
          this.showSuppressionSeanceModal = true
        },
        error: (err) => {
          console.log(err)
        }
      })
    }
  }

  closeSuppressionSeanceModal(): void {
    this.showSuppressionSeanceModal = false
  }
}
