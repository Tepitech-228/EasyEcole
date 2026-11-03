import { Component, OnInit } from '@angular/core';
import { ElearningExamenService } from 'src/app/data/modules/elearning/services/elearning-examen.service';

@Component({
  selector: 'app-mes-examens-page',
  templateUrl: './mes-examens-page.component.html'
})
export class MesExamensPageComponent implements OnInit {
  examens: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private examService: ElearningExamenService) {}

  ngOnInit(): void {
    this.loadExamens();
  }

  loadExamens(): void {
    this.loading = true;
    this.errorMessage = '';
    this.examService.getStudentExams().subscribe({
      next: (examens) => {
        this.examens = Array.isArray(examens) ? examens : [];
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Impossible de charger vos examens.';
        this.loading = false;
      }
    });
  }

  reserveSession(session: any): void {
    this.successMessage = '';
    this.examService.reserveSession(Number(session.id)).subscribe({
      next: () => {
        this.successMessage = 'Réservation enregistrée.';
        this.loadExamens();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'La réservation n’a pas pu être enregistrée.';
      }
    });
  }

  cancelReservation(examen: any): void {
    this.successMessage = '';
    this.examService.cancelReservation(Number(examen.id)).subscribe({
      next: () => {
        this.successMessage = 'Réservation annulée.';
        this.loadExamens();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'L’annulation n’a pas pu être confirmée.';
      }
    });
  }

  formatDate(value: string | Date | null): string {
    if (!value) return 'Date à définir';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date à définir';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  currentReservation(examen: any): any | null {
    return examen?.reservation || null;
  }
}
