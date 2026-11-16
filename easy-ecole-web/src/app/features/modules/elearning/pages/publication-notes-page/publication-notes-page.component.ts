import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DevoirService } from 'src/app/data/modules/elearning/services/devoir.service';
import { ElearningExamenService } from 'src/app/data/modules/elearning/services/elearning-examen.service';

interface GradeRow {
  student: string;
  identifier: string;
  grade: number;
  published: boolean;
}

interface EvaluationRow {
  id: string;
  assessmentId: number;
  kind: 'devoir' | 'examen';
  title: string;
  course: string;
  period: string;
  date: string | Date | null;
  grades: GradeRow[];
}

@Component({
  selector: 'app-publication-notes-page',
  templateUrl: './publication-notes-page.component.html'
})
export class PublicationNotesPageComponent implements OnInit {
  evaluations: EvaluationRow[] = [];
  loading = true;
  publishingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  filter: 'tout' | 'devoir' | 'examen' = 'tout';

  constructor(
    private readonly devoirService: DevoirService,
    private readonly examenService: ElearningExamenService,
  ) {}

  ngOnInit(): void {
    this.loadEvaluations();
  }

  get filteredEvaluations(): EvaluationRow[] {
    return this.filter === 'tout'
      ? this.evaluations
      : this.evaluations.filter(evaluation => evaluation.kind === this.filter);
  }

  get totalUnpublishedGrades(): number {
    return this.evaluations.reduce((total, evaluation) => total + this.unpublishedCount(evaluation), 0);
  }

  loadEvaluations(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin([this.devoirService.getAll(), this.examenService.getAll()]).subscribe({
      next: ([devoirs, examens]) => {
        this.evaluations = [
          ...devoirs.map(devoir => this.mapDevoir(devoir)),
          ...examens.map(examen => this.mapExamen(examen)),
        ].filter(evaluation => evaluation.grades.length > 0)
          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'Impossible de charger les évaluations et leurs notes.';
        this.loading = false;
      }
    });
  }

  unpublishedCount(evaluation: EvaluationRow): number {
    return evaluation.grades.filter(grade => !grade.published).length;
  }

  publishedCount(evaluation: EvaluationRow): number {
    return evaluation.grades.length - this.unpublishedCount(evaluation);
  }

  publish(evaluation: EvaluationRow): void {
    if (this.publishingId || this.unpublishedCount(evaluation) === 0) return;
    this.publishingId = evaluation.id;
    this.errorMessage = '';
    this.successMessage = '';
    const request = evaluation.kind === 'devoir'
      ? this.devoirService.publierNotes(String(evaluation.assessmentId))
      : this.examenService.publishGrades(evaluation.assessmentId);

    request.subscribe({
      next: result => {
        this.successMessage = `${result.publishedCount} note(s) publiée(s) pour « ${evaluation.title} ».`;
        this.publishingId = null;
        this.loadEvaluations();
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'La publication des notes a échoué.';
        this.publishingId = null;
      }
    });
  }

  private mapDevoir(devoir: any): EvaluationRow {
    return {
      id: `devoir-${devoir.id}`,
      assessmentId: Number(devoir.id),
      kind: 'devoir',
      title: devoir.titre || 'Devoir sans titre',
      course: devoir.cours?.titre || devoir.cours?.code || `Cours #${devoir.coursId}`,
      period: devoir.semestre ? `Semestre ${devoir.semestre}` : 'Période annuelle',
      date: devoir.dateLimite || null,
      grades: (devoir.soumissions || [])
        .filter((submission: any) => submission.note !== null && submission.note !== undefined)
        .map((submission: any) => ({
          student: [submission.apprenant?.prenoms, submission.apprenant?.nom].filter(Boolean).join(' ') || 'Étudiant',
          identifier: submission.apprenant?.identifiant || `ID ${submission.apprenantId}`,
          grade: Number(submission.note),
          published: Boolean(submission.notePubliee),
        })),
    };
  }

  private mapExamen(examen: any): EvaluationRow {
    return {
      id: `examen-${examen.id}`,
      assessmentId: Number(examen.id),
      kind: 'examen',
      title: `Examen ${examen.semestre || ''}`.trim(),
      course: examen.cours?.titre || examen.cours?.code || `Cours #${examen.coursId}`,
      period: examen.semestre || 'Période non définie',
      date: examen.dateExamen || null,
      grades: (examen.notes || []).map((note: any) => ({
        student: [note.apprenant?.prenoms, note.apprenant?.nom].filter(Boolean).join(' ') || 'Étudiant',
        identifier: note.apprenant?.identifiant || `ID ${note.utilisateurId}`,
        grade: Number(note.note),
        published: Boolean(note.notePubliee),
      })),
    };
  }
}
