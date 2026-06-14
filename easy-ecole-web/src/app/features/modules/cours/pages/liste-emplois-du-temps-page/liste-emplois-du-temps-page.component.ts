import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import allLocales from '@fullcalendar/core/locales-all';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { JoursSemaine } from 'src/app/data/enums/JoursSemaine';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { Seance } from 'src/app/data/modules/inscription/models/Seance.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

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
  seances: Seance[] = []
  selectedSeance?: Seance

  nouvelleSeanceForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    date: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    cours: new FormControl(null, []),
    description: new FormControl(null, []),
    enseignant: new FormControl(null, []),
    choisirParmiLesCours: new FormControl(true, [Validators.required]),
  })

  modificationSeanceForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    date: new FormControl(null, [Validators.required]),
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
    private enseignantService: EnseignantService
  ) {
    super()
    this.calendarOptions = {
      initialView: 'timeGridWeek',
      timeZone: 'UTC',
      headerToolbar: false,
      allDaySlot: false,
      // headerToolbar: {
      //   left: 'prev,next today',
      //   center: 'title',
      //   right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      // },
      plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
      dateClick: (arg) => this.handleDateClick(arg),
      // eventClick: this.handleEventClick.bind(this),
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
      // weekNumbers: true,
      dayMaxEvents: true,
      expandRows: true,
      contentHeight: 800,
      eventBorderColor: 'transparent',
    };
  }

  ngOnInit(): void {
    this.getCours()
    this.getEnseignants()
    this.getSeances()
  }

  ngAfterViewInit(): void {
    // console.log(this.calendarComponent)
  }

  handleDateClick(arg) {
    if (this.rolesValue.isEnseignant || this.rolesValue.isInstitution) {
      // console.log(arg.dateStr.split('T')[0], arg.dateStr.split('T')[1].split('Z')[0])
      this.nouvelleSeanceForm.get('date')!.setValue(arg.dateStr.split('T')[0])
      this.nouvelleSeanceForm.get('heureDebut')!.setValue(arg.dateStr.split('T')[1].split('Z')[0])
      this.openNouvelleSeanceModal()
    }
  }

  handleEventClick(clickInfo: EventClickArg) {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      alert()
    }
  }

  prevDate(): void {
    let calendarApi = this.calendarComponent.getApi();
    calendarApi.prev();
  }

  nextDate(): void {
    let calendarApi = this.calendarComponent.getApi();
    calendarApi.next();
  }

  onDateChange(event: any): void {
    console.log(event.target.value)
    let calendarApi = this.calendarComponent.getApi();
    calendarApi.gotoDate(event.target.value);
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

  getSeances(): void {
    this.seanceService.getAll()
      .subscribe({
        next: (res) => {
          this.seances = res

          let events: EventInput[] = this.seances.map((seance: Seance, index: number) => {
            let event: EventInput = {
              id: seance.id,
              title: seance.titre,
              start: seance.date ? seance.date?.toString() + "T" + seance.heureDebut?.toString() : seance.date,
              end: seance.date ? seance.date?.toString() + "T" + seance.heureFin?.toString() : seance.date,
              color: 'white',
              extendedProps: {
                id: seance.id,
                index: index,
                description: seance.description,
                startTime: seance.heureDebut?.toString().split(':')[0] + ':' + seance.heureDebut?.toString().split(':')[1],
                endTime: seance.heureFin?.toString().split(':')[0] + ':' + seance.heureFin?.toString().split(':')[1],
                enseignant: seance.enseignant?.utilisateur?.nom + ' ' + seance.enseignant?.utilisateur?.prenoms,
                cours: seance.cours
              },
            }

            return event
          }) ?? []

          if (this.calendarOptions) {
            this.calendarOptions.events = events
          }
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  ajouterSeance(): void {
    console.log(this.nouvelleSeanceForm.value)
    this.nouvelleSeanceForm.markAllAsTouched()
    if (this.nouvelleSeanceForm.valid) {
      let seance: Seance = new Seance()
      seance.titre = this.nouvelleSeanceForm.get('titre')!.value
      seance.date = this.nouvelleSeanceForm.get('date')!.value
      seance.heureDebut = this.nouvelleSeanceForm.get('heureDebut')!.value
      seance.heureFin = this.nouvelleSeanceForm.get('heureFin')!.value
      seance.description = this.nouvelleSeanceForm.get('description')!.value
      seance.coursId = this.nouvelleSeanceForm.get('cours')!.value
      seance.enseignantId = this.nouvelleSeanceForm.get('enseignant')!.value

      this.seanceService.create(seance).subscribe({
        next: (res) => {
          this.getSeances()
          this.closeNouvelleSeanceModal()
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

  modifierSeance(): void {
    console.log(this.modificationSeanceForm.value)
    this.modificationSeanceForm.markAllAsTouched()
    if (this.selectedSeance && this.modificationSeanceForm.valid) {
      let seance: Seance = new Seance()
      seance.id = this.selectedSeance.id
      seance.titre = this.modificationSeanceForm.get('titre')!.value
      seance.date = this.modificationSeanceForm.get('date')!.value
      seance.heureDebut = this.modificationSeanceForm.get('heureDebut')!.value
      seance.heureFin = this.modificationSeanceForm.get('heureFin')!.value
      seance.description = this.modificationSeanceForm.get('description')!.value
      seance.coursId = this.modificationSeanceForm.get('cours')!.value
      seance.enseignantId = this.modificationSeanceForm.get('enseignant')!.value

      this.seanceService.update(seance).subscribe({
        next: (res) => {
          this.getSeances()
          this.closeModificationSeanceModal()
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

  supprimerSeance(): void {
    if (this.selectedSeance) {
      this.seanceService.delete(this.selectedSeance.id!).subscribe({
        next: (res) => {
          this.getSeances()
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

  // Modals
  openNouvelleSeanceModal(): void {
    this.showNouvelleSeanceModal = true
  }

  closeNouvelleSeanceModal(): void {
    this.nouvelleSeanceForm.reset()
    this.nouvelleSeanceForm.get('choisirParmiLesCours')!.setValue(true)
    this.showNouvelleSeanceModal = false
  }

  openModificationSeanceModal(arg: any): void {
    console.log(arg);
    const seanceIndex = arg.event.extendedProps.index
    this.selectedSeance = this.seances[seanceIndex]

    if (this.selectedSeance) {
      this.modificationSeanceForm.get('titre')!.setValue(this.selectedSeance.titre)
      this.modificationSeanceForm.get('date')!.setValue(this.selectedSeance.date)
      this.modificationSeanceForm.get('heureDebut')!.setValue(this.selectedSeance.heureDebut)
      this.modificationSeanceForm.get('heureFin')!.setValue(this.selectedSeance.heureFin)
      this.modificationSeanceForm.get('description')!.setValue(this.selectedSeance.description)
      this.modificationSeanceForm.get('cours')!.setValue(this.selectedSeance.coursId)
      this.modificationSeanceForm.get('enseignant')!.setValue(this.selectedSeance.enseignantId)

      this.showModificationSeanceModal = true
    }
  }

  closeModificationSeanceModal(): void {
    this.modificationSeanceForm.reset()
    this.modificationSeanceForm.get('choisirParmiLesCours')!.setValue(true)
    this.showModificationSeanceModal = false
  }

  openSuppressionSeanceModal(arg: any): void {
    console.log(arg);
    const seanceIndex = arg.event.extendedProps.index
    this.selectedSeance = this.seances[seanceIndex]

    if(this.selectedSeance) {
      this.showSuppressionSeanceModal = true
    }
  }

  closeSuppressionSeanceModal(): void {
    this.showSuppressionSeanceModal = false
  }
}
