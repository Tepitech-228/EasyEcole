import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { JwtTokenService } from 'src/app/core/services/jwt-token.service';
import { ElearningExamenService } from 'src/app/data/modules/elearning/services/elearning-examen.service';
import { ElearningFinanceService, ElearningCourse } from 'src/app/data/modules/elearning/services/elearning-finance.service';

@Component({
  selector: 'app-examens-admin-page',
  templateUrl: './examens-admin-page.component.html'
})
export class ExamensAdminPageComponent implements OnInit, OnDestroy {
  isAdmin = false;
  loading = false;
  creating = false;
  examens: any[] = [];
  cours: ElearningCourse[] = [];
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  form = { coursId: '', dateExamen: '', lieu: '', dureeMinutes: '' };
  gradeForms: Record<number, { utilisateurId: string; note: number | null; commentaire: string }> = {};
  private openedUrls: string[] = [];

  constructor(
    private examService: ElearningExamenService,
    private financeService: ElearningFinanceService,
    private jwtTokenService: JwtTokenService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem(LocalStorageService.AUTH_TOKEN);
    if (token) {
      this.jwtTokenService.setToken(token);
      const role = (this.jwtTokenService.getDecodeToken() as any)?.role;
      this.isAdmin = role === 'admin' || role === 'institution';
    }
    if (!this.isAdmin) return;

    this.loading = true;
    this.examService.getAll().subscribe({
      next: examens => {
        this.examens = examens;
        this.examens.forEach(examen => this.gradeForms[Number(examen.id)] = {
          utilisateurId: '',
          note: null,
          commentaire: ''
        });
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error.error?.message || 'Impossible de charger les examens.';
        this.loading = false;
      }
    });
    this.financeService.getCatalogue().subscribe({
      next: cours => this.cours = cours.filter(item => item.statut === 'publie'),
      error: error => this.errorMessage = error.error?.message || 'Impossible de charger les cours e-learning.'
    });
  }

  ngOnDestroy(): void {
    this.openedUrls.forEach(url => URL.revokeObjectURL(url));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  hasExam(coursId: number | string): boolean {
    return this.examens.some(examen => Number(examen.coursId) === Number(coursId));
  }

  createExam(): void {
    if (!this.selectedFile || !this.form.coursId) return;
    if (this.selectedFile.type !== 'application/pdf' && !this.selectedFile.name.toLowerCase().endsWith('.pdf')) {
      this.errorMessage = 'Le sujet doit être un fichier PDF.';
      return;
    }

    const data = new FormData();
    data.append('coursId', this.form.coursId);
    data.append('dateExamen', this.form.dateExamen);
    data.append('lieu', this.form.lieu);
    data.append('dureeMinutes', this.form.dureeMinutes);
    data.append('statut', 'publie');
    data.append('sujet', this.selectedFile);
    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.examService.create(data).subscribe({
      next: examen => {
        this.examens = [...this.examens, examen];
        this.gradeForms[Number(examen.id)] = { utilisateurId: '', note: null, commentaire: '' };
        this.form = { coursId: '', dateExamen: '', lieu: '', dureeMinutes: '' };
        this.selectedFile = null;
        this.successMessage = 'Examen enregistré.';
        this.creating = false;
      },
      error: error => {
        this.errorMessage = error.error?.message || 'Impossible d’enregistrer cet examen.';
        this.creating = false;
      }
    });
  }

  previewSubject(examen: any): void {
    this.examService.getSubject(Number(examen.id)).subscribe({
      next: blob => this.openBlob(blob),
      error: error => this.errorMessage = error.error?.message || 'Impossible de consulter le sujet.'
    });
  }

  downloadForPrint(examen: any): void {
    this.examService.downloadForPrint(Number(examen.id)).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.openedUrls.push(url);
        const link = document.createElement('a');
        link.href = url;
        link.download = `examen-${examen.cours?.code || examen.coursId}.pdf`;
        link.click();
      },
      error: error => this.errorMessage = error.error?.message || 'Impossible de télécharger le sujet.'
    });
  }

  saveGrade(examen: any): void {
    const grade = this.gradeForms[Number(examen.id)];
    if (!grade || !grade.utilisateurId || grade.note === null) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.examService.saveGrade(Number(examen.id), {
      utilisateurId: Number(grade.utilisateurId),
      note: Number(grade.note),
      commentaire: grade.commentaire
    }).subscribe({
      next: () => this.successMessage = 'Note d’examen enregistrée.',
      error: error => this.errorMessage = error.error?.message || 'Impossible d’enregistrer la note.'
    });
  }

  private openBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    this.openedUrls.push(url);
    window.open(url, '_blank', 'noopener');
  }
}
