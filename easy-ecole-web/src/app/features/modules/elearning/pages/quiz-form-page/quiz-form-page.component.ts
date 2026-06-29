import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-quiz-form-page',
  templateUrl: './quiz-form-page.component.html',
  styleUrls: ['./quiz-form-page.component.scss']
})
export class QuizFormPageComponent extends BaseComponentClass implements OnInit {
  quizForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder, private router: Router) {
    super();
    this.quizForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      coursTitre: ['', Validators.required],
      timeLimit: [30, [Validators.required, Validators.min(5)]],
      questions: this.fb.array([this.createQuestion()])
    });
  }

  ngOnInit(): void {}

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  createQuestion(): FormGroup {
    return this.fb.group({
      texte: ['', Validators.required],
      options: this.fb.group({
        optionA: ['', Validators.required],
        optionB: ['', Validators.required],
        optionC: [''],
        optionD: ['']
      }),
      correctAnswer: ['A', Validators.required]
    });
  }

  addQuestion(): void {
    this.questions.push(this.createQuestion());
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.quizForm.invalid) return;

    const quizData = this.quizForm.value;
    quizData.id = 'q' + Date.now();
    quizData.createdAt = new Date();
    quizData.questionCount = quizData.questions.length;

    this.router.navigate(['/elearning/quiz']);
  }

  cancel(): void {
    this.router.navigate(['/elearning/quiz']);
  }
}

