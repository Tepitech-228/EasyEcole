import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { ListeNoteEvaluation } from 'src/app/data/modules/inscription/models/ListeNoteEvaluation.model';
import { TypeNoteEvaluation } from 'src/app/data/modules/inscription/models/TypeNoteEvaluation.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { ListeNoteEvaluationService } from 'src/app/data/modules/inscription/services/liste-note-evaluation.service';
import { TypeNoteEvaluationService } from 'src/app/data/modules/inscription/services/type-note-evaluation.service';

@Component({
  selector: 'app-nouvelle-evaluation-page',
  templateUrl: './nouvelle-evaluation-page.component.html',
  styleUrls: ['./nouvelle-evaluation-page.component.scss']
})
export class NouvelleEvaluationPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  alreadyExists: boolean = false
  cours: Cours[] = []
  typesNote: TypeNoteEvaluation[] = []

  evaluationForm: FormGroup = new FormGroup({
    coursId: new FormControl(null, [Validators.required]),
    typeNoteEvaluationId: new FormControl(null, [Validators.required]),
    date: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    poidsTypeNoteEvaluation: new FormControl(null, [Validators.required]),
  })

  constructor(
    private router: Router,
    private coursService: CoursService,
    private typeNoteEvaluationService: TypeNoteEvaluationService,
    private listeNoteEvaluationService: ListeNoteEvaluationService) {
    super()
    if (!this.rolesValue.isInstitution && !this.rolesValue.isEnseignant && !this.rolesValue.isAdmin) {
      this.router.navigate(['/cours/notes'])
    }
  }

  ngOnInit(): void {
    this.coursService.getAll().subscribe({ next: (res) => { this.cours = res }, error: (err) => { console.log(err) } })
    this.typeNoteEvaluationService.getAll().subscribe({ next: (res) => { this.typesNote = res }, error: (err) => { console.log(err) } })
  }

  create(): void {
    this.evaluationForm.markAllAsTouched()
    if (this.evaluationForm.valid) {
      const liste: ListeNoteEvaluation = new ListeNoteEvaluation()
      liste.coursId = this.evaluationForm.get('coursId')!.value
      liste.typeNoteEvaluationId = this.evaluationForm.get('typeNoteEvaluationId')!.value
      liste.date = this.evaluationForm.get('date')!.value
      liste.heureDebut = this.evaluationForm.get('heureDebut')!.value
      liste.heureFin = this.evaluationForm.get('heureFin')!.value
      liste.poidsTypeNoteEvaluation = this.evaluationForm.get('poidsTypeNoteEvaluation')!.value

      this.listeNoteEvaluationService.create(liste).subscribe({
        next: (res) => {
          this.router.navigate(['/cours/notes', res.id, 'saisie'])
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          if (err.error?.alreadyExists) {
            this.alreadyExists = true
            setTimeout(() => { this.alreadyExists = false }, 4000)
          } else {
            this.error = true
            setTimeout(() => { this.error = false }, 3000)
          }
        }
      })
    }
  }
}
