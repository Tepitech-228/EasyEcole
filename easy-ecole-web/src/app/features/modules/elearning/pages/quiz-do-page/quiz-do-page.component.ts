import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { QuizService } from 'src/app/data/modules/elearning/services/quiz.service';

@Component({
  selector: 'app-quiz-do-page',
  templateUrl: './quiz-do-page.component.html',
  styleUrls: ['./quiz-do-page.component.scss']
})
export class QuizDoPageComponent extends BaseComponentClass implements OnInit, OnDestroy {
  quiz: any = null;
  loading = true;
  questions: any[] = [];
  currentQuestionIndex = 0;
  selectedAnswers: { [key: number]: number } = {};
  submitted = false;
  score: number | null = null;
  totalCorrect = 0;
  timeLeft = 0;
  timerInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {
    super();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadQuiz(id);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  loadQuiz(id: string): void {
    this.loading = true;
    this.quizService.get(id).subscribe({
      next: (data) => {
        this.quiz = data;
        this.questions = data.questions || [];
        if (data.tempsLimite) {
          this.timeLeft = data.tempsLimite * 60;
          this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) this.finishQuiz();
          }, 1000);
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get totalQuestions(): number { return this.questions.length; }
  get answeredCount(): number { return Object.keys(this.selectedAnswers).length; }
  get allAnswered(): boolean { return this.answeredCount >= this.totalQuestions; }
  get progressPercent(): number { return ((this.currentQuestionIndex) / this.totalQuestions) * 100; }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timeWarning(): boolean { return this.timeLeft <= 60; }

  selectAnswer(questionIdx: number, optionIndex: number): void {
    if (!this.submitted) this.selectedAnswers[questionIdx] = optionIndex;
  }

  isAnswerSelected(questionIdx: number, optionIndex: number): boolean {
    return this.selectedAnswers[questionIdx] === optionIndex;
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.totalQuestions - 1) this.currentQuestionIndex++;
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) this.currentQuestionIndex--;
  }

  finishQuiz(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.submitted = true;
    const reponses = Object.entries(this.selectedAnswers).map(([k, v]) => ({
      questionId: parseInt(k), reponse: v
    }));
    this.quizService.repondre(this.quiz.id, reponses).subscribe({
      next: (result) => {
        this.score = Math.round((result.score / result.total) * 100);
        this.totalCorrect = result.score;
      }
    });
  }

  goBack(): void { this.router.navigate(['/elearning/quiz']); }
}
