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
import { saveAs } from 'file-saver';

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
  planningEvents: PlanningEvent[] = []
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

  // Import
  showImportPreview: boolean = false
  importCandidates: any[] = []
  importLoading: boolean = false
  showImportResult: boolean = false
  importResultMessage: string = ''
  importResultType: 'success' | 'warning' | 'error' = 'success'

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
          this.planningEvents = events
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

  // ===================== EXPORT EXCEL / WORD =====================

  private getEnseignantLabel(event: PlanningEvent): string {
    if (event.enseignant?.utilisateur?.nom) {
      return `${event.enseignant.utilisateur.nom} ${event.enseignant.utilisateur.prenoms || ''}`.trim()
    }
    return ''
  }

  private getCoursLabel(event: PlanningEvent): string {
    return event.cours?.code || event.titre || ''
  }

  private getDescriptionLabel(event: PlanningEvent): string {
    return event.cours?.intitule || event.description || ''
  }

  private formatHeure(h: any): string {
    if (h === null || h === undefined) return ''
    const s = String(h)
    if (/^\d{1,2}:\d{2}/.test(s)) return s.split(':').slice(0, 2).join(':')
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const hh = ('0' + d.getHours()).slice(-2)
      const mm = ('0' + d.getMinutes()).slice(-2)
      return `${hh}:${mm}`
    }
    return s
  }

  private formatDateFr(dateStr: string): string {
    if (!dateStr) return ''
    const parts = String(dateStr).split('T')[0].split('-')
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
  }

  private jourDeSemaine(dateStr: string): string {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const d = new Date(String(dateStr).split('T')[0] + 'T00:00:00')
    return jours[d.getDay()]
  }

  private getExportRows(): { jour: string, date: string, debut: string, fin: string, cours: string, enseignant: string, salle: string, description: string }[] {
    return this.planningEvents
      .map((event) => ({
        jour: this.jourDeSemaine(event.date),
        date: this.formatDateFr(event.date),
        debut: this.formatHeure(event.heureDebut),
        fin: this.formatHeure(event.heureFin),
        cours: this.getCoursLabel(event),
        enseignant: this.getEnseignantLabel(event),
        salle: event.salle || '',
        description: this.getDescriptionLabel(event),
      }))
      .sort((a, b) => {
        const cmpDate = a.date.localeCompare(b.date)
        if (cmpDate !== 0) return cmpDate
        return a.debut.localeCompare(b.debut)
      })
  }

  private getFiltresLabel(): string {
    const labels: string[] = []
    if (this.filterEnseignantId) {
      const e = this.enseignants.find((i) => i.id === this.filterEnseignantId)
      labels.push(`Enseignant : ${e?.utilisateur?.nom || ''} ${e?.utilisateur?.prenoms || ''}`.trim())
    }
    if (this.filterClasseId) {
      const c = this.classes.find((i) => i.id === this.filterClasseId)
      labels.push(`Classe : ${c?.libelle || ''}`)
    }
    return labels.length ? labels.join(' | ') : 'Aucun filtre'
  }

  private getPeriodeLabel(): string {
    return `Semaine du ${this.formatDateFr(this.currentWeekStart)} au ${this.formatDateFr(this.currentWeekEnd)}`
  }

  private escapeXml(value: any): string {
    if (value === null || value === undefined) return ''
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  exporterExcel(): void {
    const rows = this.getExportRows()
    if (!rows.length) return

    const entetes = ['Jour', 'Date', 'Début', 'Fin', 'Cours', 'Enseignant', 'Salle', 'Description']
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<?mso-application progid="Excel.Sheet"?>\n'
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
    xml += ' <Styles>\n'
    xml += '  <Style ss:ID="titre"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1" ss:Size="14" ss:Color="#1E3A8A"/></Style>\n'
    xml += '  <Style ss:ID="sousTitre"><Alignment ss:Horizontal="Center"/><Font ss:Italic="1" ss:Size="10" ss:Color="#666666"/></Style>\n'
    xml += '  <Style ss:ID="entete"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/></Style>\n'
    xml += '  <Style ss:ID="cellule"><Alignment ss:Vertical="Center"/></Style>\n'
    xml += ' </Styles>\n'
    xml += ' <Worksheet ss:Name="Emploi du temps">\n'
    xml += '  <Table>\n'
    xml += '   <Column ss:Width="75"/><Column ss:Width="80"/><Column ss:Width="65"/><Column ss:Width="65"/><Column ss:Width="130"/><Column ss:Width="170"/><Column ss:Width="85"/><Column ss:Width="200"/>\n'
    xml += `   <Row><Cell ss:MergeAcross="7" ss:StyleID="titre"><Data ss:Type="String">EMPLOI DU TEMPS</Data></Cell></Row>\n`
    xml += `   <Row><Cell ss:MergeAcross="7" ss:StyleID="sousTitre"><Data ss:Type="String">${this.escapeXml(this.getPeriodeLabel())}</Data></Cell></Row>\n`
    xml += `   <Row><Cell ss:MergeAcross="7" ss:StyleID="sousTitre"><Data ss:Type="String">Filtres : ${this.escapeXml(this.getFiltresLabel())}</Data></Cell></Row>\n`
    xml += '   <Row>'
    entetes.forEach((h) => { xml += `<Cell ss:StyleID="entete"><Data ss:Type="String">${h}</Data></Cell>` })
    xml += '</Row>\n'
    rows.forEach((row) => {
      xml += '   <Row>'
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.jour)}</Data></Cell>`
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.date)}</Data></Cell>`
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.debut)}</Data></Cell>`
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.fin)}</Data></Cell>`
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.cours)}</Data></Cell>`
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.enseignant)}</Data></Cell>`
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.salle)}</Data></Cell>`
      xml += `<Cell ss:StyleID="cellule"><Data ss:Type="String">${this.escapeXml(row.description)}</Data></Cell>`
      xml += '</Row>\n'
    })
    xml += '  </Table>\n'
    xml += ' </Worksheet>\n'
    xml += '</Workbook>'

    const blob = new Blob(['\ufeff' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    saveAs(blob, `emploi-du-temps_${this.currentWeekStart}_${this.currentWeekEnd}.xls`)
  }

  exporterWord(): void {
    const rows = this.getExportRows()
    if (!rows.length) return

    const joursMap: { [key: string]: typeof rows } = {}
    rows.forEach((row) => {
      if (!joursMap[row.date]) joursMap[row.date] = []
      joursMap[row.date].push(row)
    })

    const dateGeneration = new Date().toLocaleString('fr-FR')
    let html = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    html += '<head><meta charset="utf-8"><title>Emploi du temps</title></head>'
    html += '<body style="font-family:Arial, sans-serif;font-size:12px;">'
    html += '<h1 style="text-align:center;color:#1E3A8A;margin-bottom:2px;">EMPLOI DU TEMPS</h1>'
    html += `<p style="text-align:center;color:#666666;font-style:italic;margin:2px 0;">${this.escapeXml(this.getPeriodeLabel())}</p>`
    html += `<p style="text-align:center;color:#666666;font-style:italic;margin:2px 0;">Filtres : ${this.escapeXml(this.getFiltresLabel())}</p>`
    Object.keys(joursMap).forEach((date) => {
      const dayRows = joursMap[date]
      html += `<h2 style="color:#1E3A8A;margin:16px 0 6px 0;font-size:14px;">${this.escapeXml(dayRows[0].jour)} ${this.escapeXml(date)}</h2>`
      html += '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">'
      html += '<tr style="background-color:#1E3A8A;color:#ffffff;text-align:left;">'
      html += '<th style="width:80px;">Début</th><th style="width:80px;">Fin</th><th>Cours</th><th>Enseignant</th><th style="width:90px;">Salle</th>'
      html += '</tr>'
      dayRows.forEach((row) => {
        html += '<tr>'
        html += `<td>${this.escapeXml(row.debut)}</td><td>${this.escapeXml(row.fin)}</td>`
        html += `<td>${this.escapeXml(row.cours)}</td><td>${this.escapeXml(row.enseignant)}</td><td>${this.escapeXml(row.salle)}</td>`
        html += '</tr>'
      })
      html += '</table>'
    })
    html += `<p style="text-align:center;color:#999999;font-size:10px;margin-top:24px;">Document généré le ${this.escapeXml(dateGeneration)} — EasyEcole</p>`
    html += '</body></html>'

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' })
    saveAs(blob, `emploi-du-temps_${this.currentWeekStart}_${this.currentWeekEnd}.doc`)
  }

  // ===================== MODÈLE & IMPORT =====================

  telechargerModele(): void {
    const entetes = ['Jour', 'Date', 'Début', 'Fin', 'Cours', 'Enseignant', 'Salle', 'Description']
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<?mso-application progid="Excel.Sheet"?>\n'
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
    xml += ' <Styles>\n'
    xml += '  <Style ss:ID="titre"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1" ss:Size="14" ss:Color="#1E3A8A"/></Style>\n'
    xml += '  <Style ss:ID="sousTitre"><Alignment ss:Horizontal="Center"/><Font ss:Italic="1" ss:Size="10" ss:Color="#666666"/></Style>\n'
    xml += '  <Style ss:ID="entete"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/></Style>\n'
    xml += '  <Style ss:ID="cellule"><Alignment ss:Vertical="Center"/></Style>\n'
    xml += ' </Styles>\n'
    xml += ' <Worksheet ss:Name="Modèle emploi du temps">\n'
    xml += '  <Table>\n'
    xml += '   <Column ss:Width="75"/><Column ss:Width="80"/><Column ss:Width="65"/><Column ss:Width="65"/><Column ss:Width="130"/><Column ss:Width="170"/><Column ss:Width="85"/><Column ss:Width="200"/>\n'
    xml += '   <Row><Cell ss:MergeAcross="7" ss:StyleID="titre"><Data ss:Type="String">MODÈLE — EMPLOI DU TEMPS</Data></Cell></Row>\n'
    xml += '   <Row><Cell ss:MergeAcross="7" ss:StyleID="sousTitre"><Data ss:Type="String">Renseignez une ligne par séance, puis importez ce fichier.</Data></Cell></Row>\n'
    xml += '   <Row><Cell ss:MergeAcross="7" ss:StyleID="sousTitre"><Data ss:Type="String">Jour | Date (JJ/MM/AAAA) | Début (HH:MM) | Fin (HH:MM) | Cours (code ou intitulé) | Enseignant (Nom Prénom) | Salle | Description</Data></Cell></Row>\n'
    xml += '   <Row>'
    entetes.forEach((h) => { xml += `<Cell ss:StyleID="entete"><Data ss:Type="String">${h}</Data></Cell>` })
    xml += '</Row>\n'
    for (let k = 0; k < 3; k++) {
      xml += '   <Row>'
      entetes.forEach(() => { xml += '<Cell ss:StyleID="cellule"><Data ss:Type="String"></Data></Cell>' })
      xml += '</Row>\n'
    }
    xml += '  </Table>\n'
    xml += ' </Worksheet>\n'
    xml += '</Workbook>'

    const blob = new Blob(['\ufeff' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    saveAs(blob, 'modele-emploi-du-temps.xls')
  }

  onImportFileSelected(event: any): void {
    const input = event.target as HTMLInputElement
    const file = input.files && input.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      let rows: string[][] = []
      const nom = file.name.toLowerCase()
      if (nom.endsWith('.csv')) {
        rows = this.parseCsv(text)
      } else if (nom.endsWith('.xls') || nom.endsWith('.xml')) {
        rows = this.parseXmlExcel(text)
      } else {
        this.afficherResultatImport('error', 'Format non supporté. Utilisez un fichier .csv ou le modèle .xls téléchargé.')
        input.value = ''
        return
      }
      const candidates = this.buildImportCandidates(rows)
      if (!candidates.length) {
        this.afficherResultatImport('error', 'Aucune séance reconnue dans le fichier. Vérifiez que les colonnes correspondent au modèle.')
        input.value = ''
        return
      }
      this.importCandidates = candidates
      this.showImportPreview = true
      input.value = ''
    }
    reader.readAsText(file)
  }

  private detectDelimiter(text: string): string {
    const firstLine = text.split(/\r?\n/)[0] || ''
    const semicolons = (firstLine.match(/;/g) || []).length
    const commas = (firstLine.match(/,/g) || []).length
    return semicolons >= commas ? ';' : ','
  }

  private parseCsv(text: string): string[][] {
    const delim = this.detectDelimiter(text)
    const rows: string[][] = []
    let row: string[] = []
    let cell = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++ } else { inQuotes = false }
        } else {
          cell += ch
        }
      } else if (ch === '"') {
        inQuotes = true
      } else if (ch === delim) {
        row.push(cell); cell = ''
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        row.push(cell); cell = ''
        if (row.some((c) => c.trim() !== '')) rows.push(row)
        row = []
      } else {
        cell += ch
      }
    }
    row.push(cell)
    if (row.some((c) => c.trim() !== '')) rows.push(row)
    return rows
  }

  private parseXmlExcel(text: string): string[][] {
    if (!text.includes('<Workbook')) return []
    const doc = new DOMParser().parseFromString(text, 'application/xml')
    const rowsEl = doc.getElementsByTagName('Row')
    const rows: string[][] = []
    for (let i = 0; i < rowsEl.length; i++) {
      const cells = rowsEl[i].getElementsByTagName('Cell')
      const row: string[] = []
      for (let j = 0; j < cells.length; j++) {
        const data = cells[j].getElementsByTagName('Data')[0]
        row.push(data && data.textContent ? data.textContent : '')
      }
      if (row.some((c) => c.trim() !== '')) rows.push(row)
    }
    return rows
  }

  private normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  }

  private buildImportCandidates(rows: string[][]): any[] {
    const knownHeaders = ['jour', 'date', 'debut', 'fin', 'cours', 'titre', 'enseignant', 'salle', 'description']
    let headerIndex = -1
    let cols: { [key: string]: number } = {}
    for (let i = 0; i < rows.length; i++) {
      const matched: { [key: string]: number } = {}
      rows[i].forEach((cell, idx) => {
        const h = this.normalize(cell)
        if (knownHeaders.indexOf(h) > -1) matched[h] = idx
      })
      if (Object.keys(matched).length >= 3) {
        headerIndex = i
        cols = matched
        break
      }
    }
    if (headerIndex === -1) return []

    const joursMap: { [key: string]: string } = {
      lundi: '1', mardi: '2', mercredi: '3', jeudi: '4', vendredi: '5', samedi: '6', dimanche: '7',
    }

    const candidates: any[] = []
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const cells = rows[i]
      const get = (key: string): string => {
        const idx = cols[key]
        return idx !== undefined && idx < cells.length ? (cells[idx] || '').trim() : ''
      }

      const jourRaw = get('jour')
      const dateRaw = get('date')
      const debut = get('debut')
      const fin = get('fin')
      const coursLabel = get('cours') || get('titre')
      const enseignantLabel = get('enseignant')
      const salle = get('salle')
      const description = get('description')

      if (!jourRaw && !dateRaw && !debut && !fin && !coursLabel && !enseignantLabel && !salle) continue

      // Date : JJ/MM/AAAA ou AAAA-MM-JJ → AAAA-MM-JJ
      let isoDate = ''
      const dateParts = dateRaw.split('/')
      if (dateParts.length === 3 && dateParts[0].length === 2) {
        isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
      } else if (/^\d{4}-\d{2}-\d{2}/.test(dateRaw)) {
        isoDate = dateRaw.slice(0, 10)
      }

      let jourSemaine = ''
      if (isoDate) {
        const d = new Date(isoDate + 'T00:00:00')
        jourSemaine = String((d.getDay() + 6) % 7 + 1)
      }
      if (!jourSemaine && jourRaw) {
        jourSemaine = joursMap[this.normalize(jourRaw)] || ''
      }

      let enseignantId = ''
      let coursId = ''
      const warnings: string[] = []
      if (enseignantLabel) {
        const normLabel = this.normalize(enseignantLabel)
        const ens = this.enseignants.find((e) => {
          const nom = this.normalize(`${e.utilisateur?.nom || ''} ${e.utilisateur?.prenoms || ''}`)
          const nomInverse = this.normalize(`${e.utilisateur?.prenoms || ''} ${e.utilisateur?.nom || ''}`)
          return nom === normLabel || nomInverse === normLabel
        })
        if (ens) { enseignantId = ens.id! } else { warnings.push('Enseignant introuvable') }
      }
      if (coursLabel) {
        const normLabel = this.normalize(coursLabel)
        const cours = this.cours.find((c) =>
          this.normalize(c.code || '') === normLabel || this.normalize(c.intitule || '') === normLabel)
        if (cours) { coursId = cours.id! } else { warnings.push('Cours introuvable') }
      }
      if (!isoDate) warnings.push('Date invalide')
      if (!debut || !fin) warnings.push('Heures manquantes')
      if (!salle) warnings.push('Salle manquante')

      candidates.push({
        jour: jourRaw || (isoDate ? this.jourDeSemaine(isoDate) : ''),
        date: dateRaw,
        isoDate,
        debut,
        fin,
        coursLabel,
        enseignantLabel,
        salle,
        description,
        titre: coursLabel || 'Séance',
        jourSemaine,
        coursId,
        enseignantId,
        warnings,
        valide: warnings.length === 0,
      })
    }
    return candidates
  }

  importer(): void {
    const valides = this.importCandidates.filter((c) => c.valide)
    if (!valides.length || this.importLoading) return
    this.importLoading = true

    let ok = 0
    let echec = 0
    const queue = [...valides]
    const traiter = () => {
      if (!queue.length) {
        this.importLoading = false
        this.showImportPreview = false
        this.importCandidates = []
        this.loadPlanning(this.currentWeekStart, this.currentWeekEnd)
        const message = echec === 0
          ? `${ok} séance(s) importée(s) avec succès.`
          : `${ok} séance(s) importée(s), ${echec} en échec (conflit ou erreur).`
        this.afficherResultatImport(echec === 0 ? 'success' : 'warning', message)
        return
      }
      const c = queue.shift()
      const seance: Seance = new Seance()
      seance.titre = c.titre
      seance.jourSemaine = c.jourSemaine
      seance.salle = c.salle
      seance.dateDebut = c.isoDate
      seance.dateFin = c.isoDate
      seance.heureDebut = c.debut
      seance.heureFin = c.fin
      seance.description = c.description || undefined
      seance.coursId = c.coursId || undefined
      seance.enseignantId = c.enseignantId || undefined
      this.seanceService.create(seance).subscribe({
        next: () => { ok++; traiter() },
        error: () => { echec++; traiter() },
      })
    }
    traiter()
  }

  hasImportValides(): boolean {
    return this.importCandidates.some((c) => c.valide)
  }

  resetImportPreview(): void {
    this.showImportPreview = false
    this.importCandidates = []
    this.importLoading = false
  }

  private afficherResultatImport(type: 'success' | 'warning' | 'error', message: string): void {
    this.importResultType = type
    this.importResultMessage = message
    this.showImportResult = true
    setTimeout(() => { this.showImportResult = false }, 8000)
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
