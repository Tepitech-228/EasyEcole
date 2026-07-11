import { Component, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import allLocales from '@fullcalendar/core/locales-all';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { EvenementCalendrier } from 'src/app/data/modules/scolarite/models/EvenementCalendrier.model';
import { EvenementCalendrierService } from 'src/app/data/modules/scolarite/services/evenement-calendrier.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

const TYPE_COULEURS: Record<string, string> = {
  cours: '#3b82f6',
  examen: '#ef4444',
  vacance: '#10b981',
  sportif: '#f59e0b',
  culturel: '#8b5cf6',
  reunion: '#ec4899',
  administratif: '#06b6d4',
  ferie: '#f97316'
};

@Component({
  selector: 'app-calendrier-page',
  templateUrl: './calendrier-page.component.html',
  styleUrls: ['./calendrier-page.component.scss']
})
export class CalendrierPageComponent extends BaseComponentClass implements OnInit {
  evenements: EvenementCalendrier[] = [];
  _evenements: EvenementCalendrier[] = [];
  filterType: string = '';
  filterClasse: string = '';
  loading: boolean = false;
  addingEvent: boolean = false;
  publishing: boolean = false;
  errorMessage: string = '';
  newEvent: any = { titre: '', date: '', type: '', description: '' };
  calendarView: string = 'dayGridMonth';

  calendarOptions?: CalendarOptions
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  constructor(private calendrierService: EvenementCalendrierService) {
    super();
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      timeZone: 'UTC',
      headerToolbar: false,
      plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
      eventClick: (arg) => this.handleEventClick(arg),
      locale: 'fr',
      locales: allLocales,
      firstDay: 1,
      height: 650,
      eventBorderColor: 'transparent',
    };
  }

  ngOnInit(): void {
    this.loadEvenements();
  }

  get typeList(): string[] {
    return [...new Set(this.evenements.map(e => e.type))];
  }

  get classeList(): { id: number; libelle: string }[] {
    const classes = this.evenements.filter(e => e.classe).map(e => e.classe).filter(Boolean);
    const map = new Map<number, string>();
    for (const c of classes) {
      map.set(c.id, c.libelle);
    }
    return Array.from(map.entries()).map(([id, libelle]) => ({ id, libelle }));
  }

  loadEvenements(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: any = {};
    if (this.filterType) params.type = this.filterType;
    if (this.filterClasse) params.classeId = this.filterClasse;

    this.calendrierService.getAll(params).subscribe({
      next: (data) => {
        this.evenements = data;
        this._evenements = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.updateCalendar();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des événements';
        this.loading = false;
      }
    });
  }

  private updateCalendar(): void {
    const calendarEvents: EventInput[] = this._evenements.map(ev => {
      const couleur = ev.couleur || TYPE_COULEURS[ev.type] || '#3b82f6';
      return {
        id: ev.id,
        title: ev.titre,
        start: ev.date,
        allDay: true,
        backgroundColor: couleur + '20',
        borderColor: couleur,
        textColor: couleur,
        extendedProps: {
          type: ev.type,
          description: ev.description,
          statut: ev.statutEvenement,
          visibilite: ev.visibilite,
          classe: ev.classe?.libelle,
          parcours: ev.parcours?.titre
        }
      };
    });

    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(calendarEvents);
    } else if (this.calendarOptions) {
      this.calendarOptions.events = calendarEvents;
    }
  }

  createEvent(): void {
    if (!this.newEvent.titre || !this.newEvent.date || !this.newEvent.type) return;
    this.addingEvent = true;
    this.errorMessage = '';
    this.calendrierService.create(this.newEvent as any).subscribe({
      next: () => {
        this.newEvent = { titre: '', date: '', type: '', description: '' };
        this.addingEvent = false;
        this.loadEvenements();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la création de l\'événement';
        this.addingEvent = false;
      }
    });
  }

  deleteEvent(ev: EvenementCalendrier): void {
    if (!ev.id || !confirm('Supprimer cet événement ?')) return;
    this.calendrierService.delete(ev.id).subscribe({
      next: () => this.loadEvenements(),
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  filtrer(): void {
    this.loadEvenements();
  }

  reinitialiserFiltres(): void {
    this.filterType = '';
    this.filterClasse = '';
    this.loadEvenements();
  }

  getColor(type: string): string {
    return TYPE_COULEURS[type] || '#3b82f6';
  }

  getTypeCount(type: string): number {
    return this.evenements.filter(e => e.type === type).length;
  }

  changeView(view: string): void {
    this.calendarView = view;
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  }

  prevDate(): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) calendarApi.prev();
  }

  nextDate(): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) calendarApi.next();
  }

  publierCalendrier(): void {
    this.publishing = true;
    this.calendrierService.publierCalendrier().subscribe({
      next: () => {
        this.publishing = false;
        this.loadEvenements();
      },
      error: () => {
        this.publishing = false;
        this.errorMessage = 'Erreur lors de la publication';
      }
    });
  }

  handleEventClick(clickInfo: any): void {
    const props = clickInfo.event.extendedProps;
    alert(`${clickInfo.event.title}\nType: ${props.type}\n${props.description ? 'Description: ' + props.description : ''}${props.classe ? '\nClasse: ' + props.classe : ''}${props.parcours ? '\nParcours: ' + props.parcours : ''}\nStatut: ${props.statut || 'N/A'}`);
  }
}
