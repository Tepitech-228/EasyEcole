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

  joursSemaineList = [
    { value: JoursSemaine.LUNDI, label: 'Lundi' },
    { value: JoursSemaine.MARDI, label: 'Mardi' },
    { value: JoursSemaine.MERCREDI, label: 'Mercredi' },
    { value: JoursSemaine.JEUDI, label: 'Jeudi' },
    { value: JoursSemaine.VENDREDI, label: 'Vendredi' },
    { value: JoursSemaine.SAMEDI, label: 'Samedi' },
  ]

  nouvelleSeanceForm: FormGroup = new FormGroup({
    titre: new FormControl(null, []),
    description: new FormControl(null, []),
    jourSemaine: new FormControl(null, []),
    salle: new FormControl(null, [Validators.required]),
    dateDebut: new FormControl(null, [Validators.required]),
    dateFin: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
  })

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
          right: 'today'
        },
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
        dateClick: (arg) => this.handleDateClick(arg),
        eventClick: this.handleEventClick.bind(this),
        locale: 'fr',
        locales: allLocales,
        firstDay: 1,
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
        dayMaxEvents: true,
        expandRows: true,
        contentHeight: 800,
        events: this.getSeances()
      };
    }, 100);
  }

  handleDateClick(arg) {
    this.selectedDate = arg.date
    const dayOfWeek = (arg.date.getDay() + 6) % 7 + 1
    const jourMap: Record<number, string> = {
      1: JoursSemaine.LUNDI, 2: JoursSemaine.MARDI, 3: JoursSemaine.MERCREDI,
      4: JoursSemaine.JEUDI, 5: JoursSemaine.VENDREDI, 6: JoursSemaine.SAMEDI,
      7: JoursSemaine.DIMANCHE
    }
    this.nouvelleSeanceForm.get('jourSemaine')!.setValue(jourMap[dayOfWeek])
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
        const dayNames: Record<string, string> = {
          [JoursSemaine.LUNDI]: 'Lundi',
          [JoursSemaine.MARDI]: 'Mardi',
          [JoursSemaine.MERCREDI]: 'Mercredi',
          [JoursSemaine.JEUDI]: 'Jeudi',
          [JoursSemaine.VENDREDI]: 'Vendredi',
          [JoursSemaine.SAMEDI]: 'Samedi',
        }
        return {
          id: seance.id,
          title: `${seance.titre ?? this.cours!.code} - ${dayNames[seance.jourSemaine!] || ''} (${seance.salle || ''})`,
          start: seance.heureDebut?.toString(),
          end: seance.heureFin?.toString(),
          backgroundColor: 'amber',
          allDay: false,
          description: seance.description,
          daysOfWeek: [parseInt(seance.jourSemaine || '1')],
          startTime: seance.heureDebut?.toString(),
          endTime: seance.heureFin?.toString(),
          startRecur: seance.dateDebut?.toString(),
          endRecur: seance.dateFin?.toString(),
        }
      }) ?? []
    }

    return events
  }

  ajouterSeance(): void {
    this.nouvelleSeanceForm.markAllAsTouched()
    if (this.nouvelleSeanceForm.valid && this.cours) {
      let seance: Seance = new Seance()
      seance.titre = this.nouvelleSeanceForm.get('titre')!.value
      seance.description = this.nouvelleSeanceForm.get('description')!.value
      seance.jourSemaine = this.nouvelleSeanceForm.get('jourSemaine')!.value
      seance.salle = this.nouvelleSeanceForm.get('salle')!.value
      seance.dateDebut = this.nouvelleSeanceForm.get('dateDebut')!.value
      seance.dateFin = this.nouvelleSeanceForm.get('dateFin')!.value
      seance.heureDebut = this.nouvelleSeanceForm.get('heureDebut')!.value
      seance.heureFin = this.nouvelleSeanceForm.get('heureFin')!.value
      seance.coursId = this.cours.id

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