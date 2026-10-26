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

/**
 * Ligne d'alerte de pointage renvoyée par `getRetardsEnseignants`.
 * Champs optionnels : le contrat backend n'est pas typé côté service
 * (`Observable<any[]>`), on reste donc tolérant sur la forme exacte.
 */
interface TardyTeacher {
  enseignant?: {
    nom?: string;
    prenoms?: string;
  };
  cours?: string;
  heureDebut?: string;
  heureFin?: string;
  statut?: string;
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
  tardyTeachers: TardyTeacher[] = [];
  lastUpdated: Date | null = null;
  private refreshSubscription?: Subscription;

  constructor(private seanceService: SeanceService) {
    super();
  }

  ngOnInit(): void {
    this.reload();
    this.refreshSubscription = interval(60000).subscribe(() => this.loadTardiness());
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  get totalTeachers(): number {
    return this.teachers.length;
  }

  get totalCourses(): number {
    return this.courses.length;
  }

  get totalHoursDone(): number {
    return this.teachers.reduce((sum, teacher) => sum + Number(teacher.heuresEffectuees || 0), 0);
  }

  get totalHoursPlanned(): number {
    return this.teachers.reduce((sum, teacher) => sum + Number(teacher.heuresPlanifiees || 0), 0);
  }

  /** Avancement global du planning (0-100), borné pour rester affichable. */
  get completionRate(): number {
    if (!this.totalHoursPlanned) {
      return 0;
    }
    return Math.min(100, Math.round((this.totalHoursDone / this.totalHoursPlanned) * 100));
  }

  /** Échelle des barres de progression : heures effectuées les plus élevées. */
  get maxTeacherHours(): number {
    return this.teachers.reduce((max, teacher) => Math.max(max, Number(teacher.heuresEffectuees || 0)), 0);
  }

  /** Échelle des barres de progression : volume consommé le plus élevé. */
  get maxCourseHours(): number {
    return this.courses.reduce((max, course) => Math.max(max, Number(course.volumeConsomme || 0)), 0);
  }

  /** Largeur (%) de la barre « heures effectuées » relativement au maximum. */
  teacherBarWidth(teacher: TeacherHours): number {
    const max = this.maxTeacherHours;
    if (!max) {
      return 0;
    }
    return Math.round((Number(teacher.heuresEffectuees || 0) / max) * 100);
  }

  /** Largeur (%) de la barre « volume consommé » relativement au maximum. */
  courseBarWidth(course: CourseHours): number {
    const max = this.maxCourseHours;
    if (!max) {
      return 0;
    }
    return Math.min(100, Math.round((Number(course.volumeConsomme || 0) / max) * 100));
  }

  /** Nom complet affichable d'une ligne d'alerte (« Prénoms Nom »). */
  tardyTeacherName(item: TardyTeacher): string {
    const parts = [item?.enseignant?.prenoms, item?.enseignant?.nom]
      .filter((part) => !!part && !!part.trim());
    return parts.length ? parts.join(' ') : 'Enseignant non renseigné';
  }

  /** Initiales utilisées par l'avatar (ex. « KOUASSI Marie » -> « KM »). */
  initials(name?: string): string {
    if (!name) {
      return '—';
    }
    const parts = name.trim().split(/\s+/).filter((part) => !!part);
    if (!parts.length) {
      return '—';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }

  /**
   * Heure lisible pour l'affichage (« 08:00:00 » ou Date -> « 08:00 »).
   * Le backend renvoie les colonnes TIME en « HH:MM:SS ».
   */
  hhmm(value?: string | Date | null): string {
    if (!value) {
      return '—';
    }
    const raw = value instanceof Date ? value.toTimeString() : String(value);
    return raw.slice(0, 5) || '—';
  }

  /** Recharge l'ensemble du tableau de bord (bouton « Actualiser » / « Réessayer »). */
  reload(): void {
    this.loadHours();
    this.loadTardiness();
  }

  private loadHours(): void {
    this.loading = true;
    this.error = '';
    const month = new Date().toISOString().slice(0, 7);
    this.seanceService.getVolumesEnseignants(month).subscribe({
      next: (response) => {
        this.teachers = response?.data || [];
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le suivi horaire des enseignants.';
        this.loading = false;
      }
    });

    this.seanceService.getVolumesHoraires().subscribe({
      next: (courses) => {
        this.courses = courses || [];
        this.lastUpdated = new Date();
      },
      error: () => this.error = 'Impossible de charger les volumes horaires des cours.'
    });
  }

  private loadTardiness(): void {
    this.seanceService.getRetardsEnseignants().subscribe({
      next: (rows) => {
        this.tardyTeachers = rows || [];
        this.lastUpdated = new Date();
      },
      error: () => this.error = 'Impossible d’actualiser les alertes de pointage.'
    });
  }
}
