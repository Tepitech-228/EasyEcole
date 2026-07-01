import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { QuizService } from 'src/app/data/modules/elearning/services/quiz.service';

@Component({
  selector: 'app-quiz-form-page',
  templateUrl: './quiz-form-page.component.html',
  styleUrls: ['./quiz-form-page.component.scss']
})
export class QuizFormPageComponent extends BaseComponentClass implements OnInit {
  quizForm: FormGroup;
  submitted = false;
  coursList: any[] = [];
  isEdit = false;
  quizId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private quizService: QuizService
  ) {
    super();
    this.quizForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      coursId: ['', Validators.required],
      tempsLimite: [30, [Validators.required, Validators.min(1)]],
      questions: this.fb.array([this.createQuestion()])
    });
  }

  ngOnInit(): void {
    this.quizId = this.route.snapshot.paramMap.get('id');
    if (this.quizId) {
      this.isEdit = true;
      this.quizService.get(this.quizId).subscribe({
        next: (data) => {
          this.quizForm.patchValue({
            titre: data.titre, description: data.description,
            coursId: data.coursId, tempsLimite: data.tempsLimite
          });
          this.questions.clear();
          if (data.questions) {
            for (const q of data.questions) {
              this.questions.push(this.fb.group({
                texte: [q.texte, Validators.required],
                options: [q.options || ['', '', '', ''], Validators.required],
                reponseCorrecte: [q.reponseCorrecte || '0', Validators.required]
              }));
            }
          }
        }
      });
    }
  }

  get questions(): FormArray { return this.quizForm.get('questions') as FormArray; }

  createQuestion(): FormGroup {
    return this.fb.group({
      texte: ['', Validators.required],
      options: [['', '', '', ''], Validators.required],
      reponseCorrecte: ['0', Validators.required]
    });
  }

  addQuestion(): void { this.questions.push(this.createQuestion()); }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) this.questions.removeAt(index);
  }

  trackByIndex(index: number): number { return index; }

  onSubmit(): void {
    this.submitted = true;
    if (this.quizForm.invalid) return;
    const formValue = this.quizForm.value;
    const payload = {
      titre: formValue.titre,
      description: formValue.description,
      coursId: formValue.coursId,
      tempsLimite: formValue.tempsLimite,
      questions: formValue.questions,
    };
    this.quizService.create(payload).subscribe({
      next: () => this.router.navigate(['/elearning/quiz']),
      error: () => {}
    });
  }

  cancel(): void { this.router.navigate(['/elearning/quiz']); }
}
