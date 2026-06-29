import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-quiz-page',
  templateUrl: './quiz-page.component.html',
  styleUrls: ['./quiz-page.component.scss']
})
export class QuizPageComponent extends BaseComponentClass implements OnInit {
  quizList: any[] = [];

  constructor(private router: Router) {
    super();
  }

  ngOnInit(): void {
  }

  createQuiz(): void {
    this.router.navigate(['/elearning/quiz/nouveau']);
  }

  takeQuiz(id: string): void {
    this.router.navigate(['/elearning/quiz', id]);
  }
}

