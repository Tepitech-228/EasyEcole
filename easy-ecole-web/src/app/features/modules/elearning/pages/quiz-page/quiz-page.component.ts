import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { QuizService } from 'src/app/data/modules/elearning/services/quiz.service';

@Component({
  selector: 'app-quiz-page',
  templateUrl: './quiz-page.component.html',
  styleUrls: ['./quiz-page.component.scss']
})
export class QuizPageComponent extends BaseComponentClass implements OnInit {
  quizList: any[] = [];
  loading = true;
  showCreateModal = false;
  createForm: any = { titre: '', description: '', tempsLimite: 30, coursId: '', questions: [] };

  constructor(private router: Router, private quizService: QuizService) {
    super();
  }

  ngOnInit(): void {
    this.loadQuiz();
  }

  loadQuiz(): void {
    this.loading = true;
    this.quizService.getAll().subscribe({
      next: (data) => { this.quizList = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  createQuiz(): void {
    this.router.navigate(['/elearning/quiz/nouveau']);
  }

  takeQuiz(id: string): void {
    this.router.navigate(['/elearning/quiz', id]);
  }

  deleteQuiz(id: string): void {
    if (confirm('Supprimer ce quiz ?')) {
      this.quizService.delete(id).subscribe({ next: () => this.loadQuiz() });
    }
  }

  getScoreLabel(score: number): string {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'danger';
  }

  canManage(): boolean { return this.rolesValue.isInstitution || this.rolesValue.isAdmin || this.rolesValue.isEnseignant; }
}
