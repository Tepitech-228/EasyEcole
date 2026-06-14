import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { CalendarOptions, DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import allLocales from '@fullcalendar/core/locales-all';
import { Seance } from 'src/app/data/modules/inscription/models/Seance.model';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { JoursSemaine } from 'src/app/data/enums/JoursSemaine';
import { ChapitreCours } from 'src/app/data/modules/inscription/models/ChapitreCours.model';

@Component({
  selector: 'app-details-cours-page',
  templateUrl: './details-cours-page.component.html',
  styleUrls: ['./details-cours-page.component.scss']
})
export class DetailsCoursPageComponent extends BaseComponentClass implements OnInit {

  alreadyExists: boolean = false
  error: boolean = false
  
  id: string
  cours?: Cours
  activeTab: number = 1

  selectedDate?: Date
  showNouvelleSeanceModal: boolean = false
  readonly joursSemaine = JoursSemaine

  nouvelleSeanceForm: FormGroup = new FormGroup({
    titre: new FormControl(null, []),
    description: new FormControl(null, []),
    jour: new FormControl(null, []),
    date: new FormControl(null, []),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
  })

  // @ViewChild('calendar') calendarComponent?: FullCalendarComponent
  
  calendarOptions?: CalendarOptions

  constructor(
    private coursService: CoursService,
    private seanceService: SeanceService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getCours()
    this.initCalendar()
  }

  ngOnInit(): void {
  }

  initCalendar(): void {
    setTimeout(() => {
      this.calendarOptions = {
        initialView: 'dayGridMonth',
        timeZone: 'UTC',
        headerToolbar: {
          left: 'prev next',
          // center: 'title',
          right: 'today'
        },
        // headerToolbar: {
        //   left: 'prev,next today',
        //   center: 'title',
        //   right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        // },
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
        dateClick: (arg) => this.handleDateClick(arg),
        eventClick: this.handleEventClick.bind(this),
        locale: 'fr',
        locales: allLocales,
        firstDay: 1,
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
        // weekNumbers: true,
        dayMaxEvents: true,
        expandRows: true,
        contentHeight: 800,
        events: this.getSeances()
      };
    }, 100);

    // let calendarApi = this.calendarComponent?.getApi();
    // console.log(calendarApi)
    // calendarApi?.next();
  }

  handleDateClick(arg) {
    this.selectedDate = arg.date
    this.openNouvelleSeanceModal()
  }


  handleEventClick(clickInfo: EventClickArg) {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      alert()
    }
  }

  getCours(): void {
    this.coursService.get(this.id)
      .subscribe(
        {
          next: (res) => {
            this.cours = res
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404 || err.status == 403) {
              this.router.navigate(['/cours/cours'])
            }
          },
        }
      )
  }

  getSeances(): EventInput[] {
    let events: EventInput[] = []

    if(this.cours) {
      events = this.cours.seances?.map((seance: Seance) => {
        let event: EventInput = {
          id: seance.id,
          title: seance.titre ?? this.cours!.code + " - " + this.cours!.intitule,
          start: seance.date ? seance.date?.toString() + "T" + seance.heureDebut?.toString() : seance.date,
          end: seance.date ? seance.date?.toString() + "T" + seance.heureFin?.toString() : seance.date,
          backgroundColor: 'amber',
          allDay: seance.date == undefined
        }

        return event
      }) ?? []
    }

    return events
  }

  ajouterSeance(): void {
    console.log(this.nouvelleSeanceForm.value)
    this.nouvelleSeanceForm.markAllAsTouched()
    if (this.nouvelleSeanceForm.valid && this.cours) {
      let seance: Seance = new Seance()
      seance.titre = this.nouvelleSeanceForm.get('titre')!.value
      seance.description = this.nouvelleSeanceForm.get('description')!.value
      // seance.jour = this.nouvelleSeanceForm.get('jour')!.value
      seance.date = this.nouvelleSeanceForm.get('date')!.value
      seance.heureDebut = this.nouvelleSeanceForm.get('heureDebut')!.value
      seance.heureFin = this.nouvelleSeanceForm.get('heureFin')!.value
      seance.coursId = this.cours.id
      // seance.enseignantId = this.cours.id

      this.seanceService.create(seance).subscribe({
        next: (res) => {
          this.getCours()
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

  // Modals
  openNouvelleSeanceModal(): void {
    this.showNouvelleSeanceModal = true
  }
  closeNouvelleSeanceModal(): void {
    this.showNouvelleSeanceModal = false
    this.nouvelleSeanceForm.reset()
  }
}
