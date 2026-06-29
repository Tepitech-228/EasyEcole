import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-quiz-do-page',
  templateUrl: './quiz-do-page.component.html',
  styleUrls: ['./quiz-do-page.component.scss']
})
export class QuizDoPageComponent extends BaseComponentClass implements OnInit {
  quiz: any = null;
  currentQuestionIndex = 0;
  selectedAnswers: { [key: number]: string } = {};
  submitted = false;
  score: number | null = null;
  totalCorrect = 0;

  constructor(private route: ActivatedRoute, private router: Router) {
    super();
  }

  ngOnInit(): void {
  }

  get currentQuestion(): any {
    if (!this.quiz) return null;
    return this.quiz.questions[this.currentQuestionIndex];
  }

  get totalQuestions(): number {
    return this.quiz?.questions?.length || 0;
  }

  get answeredCount(): number {
    return Object.keys(this.selectedAnswers).length;
  }

  get allAnswered(): boolean {
    return this.answeredCount >= this.totalQuestions;
  }

  get progressPercent(): number {
    return ((this.currentQuestionIndex) / this.totalQuestions) * 100;
  }

  selectAnswer(optionIndex: number): void {
    if (!this.submitted) {
      this.selectedAnswers[this.currentQuestionIndex] = optionIndex.toString();
    }
  }

  isAnswerSelected(optionIndex: number): boolean {
    return this.selectedAnswers[this.currentQuestionIndex] === optionIndex.toString();
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.totalQuestions - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  finishQuiz(): void {
    this.totalCorrect = 0;
    for (let i = 0; i < this.totalQuestions; i++) {
      const selected = parseInt(this.selectedAnswers[i], 10);
      if (selected === this.quiz.questions[i].correctAnswer) {
        this.totalCorrect++;
      }
    }
    this.score = Math.round((this.totalCorrect / this.totalQuestions) * 100);
    this.submitted = true;
  }

  goBack(): void {
    this.router.navigate(['/elearning/quiz']);
  }
}

