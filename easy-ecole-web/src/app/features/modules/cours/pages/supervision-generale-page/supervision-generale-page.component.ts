import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';

interface TeacherHours {
  enseignantId: number;
  nom: string;
  heuresPlanifiees: number;
  heuresEffectuees: number;
  heuresRestantes: number;
  absences: number;
}

interface CourseHours {
  coursId: number;
  code: string;
  intitule: string;
  volumeHoraire: number;
  volumeConsomme: number;
  volumeRestant: number;
  depassement: boolean;
}

@Component({
  selector: 'app-supervision-generale-page',
  templateUrl: './supervision-generale-page.component.html',
  styleUrls: ['./supervision-generale-page.component.scss']
})
export class SupervisionGeneralePageComponent extends BaseComponentClass implements OnInit, OnDestroy {
  loading = true;
  error = '';
  teachers: TeacherHours[] = [];
  courses: CourseHours[] = [];
  tardyTeachers: any[] = [];
  private refreshSubscription?: Subscription;

  constructor(private seanceService: SeanceService) {
    super();
  }

  ngOnInit(): void {
    this.loadHours();
    this.loadTardiness();
    this.refreshSubscription = interval(60000).subscribe(() => this.loadTardiness());
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  get totalTeachers(): number {
    return this.teachers.length;
  }

  get totalHoursDone(): number {
    return this.teachers.reduce((sum, teacher) => sum + Number(teacher.heuresEffectuees || 0), 0);
  }

  get totalHoursPlanned(): number {
    return this.teachers.reduce((sum, teacher) => sum + Number(teacher.heuresPlanifiees || 0), 0);
  }

  private loadHours(): void {
    this.loading = true;
    this.error = '';
    const month = new Date().toISOString().slice(0, 7);
    this.seanceService.getVolumesEnseignants(month).subscribe({
      next: (response) => {
        this.teachers = response?.data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le suivi horaire des enseignants.';
        this.loading = false;
      }
    });

    this.seanceService.getVolumesHoraires().subscribe({
      next: (courses) => this.courses = courses || [],
      error: () => this.error = 'Impossible de charger les volumes horaires des cours.'
    });
  }

  private loadTardiness(): void {
    this.seanceService.getRetardsEnseignants().subscribe({
      next: (rows) => this.tardyTeachers = rows || [],
      error: () => this.error = 'Impossible d’actualiser les alertes de pointage.'
    });
  }
}
