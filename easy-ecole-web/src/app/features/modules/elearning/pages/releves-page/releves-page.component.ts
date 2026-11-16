import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DevoirService } from 'src/app/data/modules/elearning/services/devoir.service';
import { ElearningExamenService } from 'src/app/data/modules/elearning/services/elearning-examen.service';

interface StudentGrade {
  kind: 'devoir' | 'examen';
  title: string;
  course: string;
  period: string;
  grade: number;
  comment: string | null;
  publishedAt: string | Date | null;
}

@Component({
  selector: 'app-releves-page',
  templateUrl: './releves-page.component.html'
})
export class RelevesPageComponent implements OnInit, OnDestroy {
  grades: StudentGrade[] = [];
  loading = true;
  refreshing = false;
  lastUpdated: Date | null = null;
  errorMessage = '';
  filter: 'tout' | 'devoir' | 'examen' = 'tout';

  private readonly refreshIntervalMs = 30000;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private inFlight = false;
  private readonly onWindowFocus = (): void => { this.loadGrades(true); };

  constructor(
    private readonly devoirService: DevoirService,
    private readonly examenService: ElearningExamenService,
  ) {}

  ngOnInit(): void {
    this.loadGrades();
    this.refreshTimer = setInterval(() => this.loadGrades(true), this.refreshIntervalMs);
    window.addEventListener('focus', this.onWindowFocus);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    window.removeEventListener('focus', this.onWindowFocus);
  }

  get filteredGrades(): StudentGrade[] {
    return this.filter === 'tout' ? this.grades : this.grades.filter(grade => grade.kind === this.filter);
  }

  get devoirCount(): number {
    return this.grades.filter(grade => grade.kind === 'devoir').length;
  }

  get examenCount(): number {
    return this.grades.filter(grade => grade.kind === 'examen').length;
  }

  loadGrades(silent = false): void {
    if (this.inFlight) return;
    this.inFlight = true;
    if (!silent) {
      this.loading = true;
      this.errorMessage = '';
    }
    this.refreshing = silent;
    forkJoin([this.devoirService.getAll(), this.examenService.getStudentExams()]).subscribe({
      next: ([devoirs, examens]) => {
        const devoirGrades = devoirs.reduce((results: StudentGrade[], devoir) => {
          const submission = devoir.soumission;
          if (submission?.notePubliee && submission.note !== null && submission.note !== undefined) {
            results.push({
              kind: 'devoir',
              title: devoir.titre || 'Devoir',
              course: devoir.cours?.titre || devoir.cours?.code || 'Cours',
              period: devoir.semestre ? `Semestre ${devoir.semestre}` : 'Annuel',
              grade: Number(submission.note),
              comment: submission.commentaire || null,
              publishedAt: submission.notePublieeLe || submission.dateCorrection || null,
            });
          }
          return results;
        }, []);
        const examGrades = examens.reduce((results: StudentGrade[], examen) => {
          if (examen.resultat) {
            results.push({
              kind: 'examen',
              title: `Examen ${examen.semestre || ''}`.trim(),
              course: examen.cours?.titre || examen.cours?.code || 'Cours',
              period: examen.semestre || 'Période non définie',
              grade: Number(examen.resultat.note),
              comment: examen.resultat.commentaire || null,
              publishedAt: examen.resultat.publieLe || null,
            });
          }
          return results;
        }, []);
        this.grades = [...devoirGrades, ...examGrades]
          .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        this.lastUpdated = new Date();
        this.errorMessage = '';
        this.inFlight = false;
        this.refreshing = false;
        this.loading = false;
      },
      error: error => {
        this.inFlight = false;
        this.refreshing = false;
        this.loading = false;
        if (!silent) {
          this.errorMessage = error?.error?.message || 'Impossible de charger vos relevés de notes.';
        }
      }
    });
  }

  printReleve(): void {
    window.print();
  }
}
