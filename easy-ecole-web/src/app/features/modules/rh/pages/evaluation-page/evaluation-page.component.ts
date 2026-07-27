import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-evaluation-page',
  templateUrl: './evaluation-page.component.html',
  styleUrls: ['./evaluation-page.component.scss']
})
export class EvaluationPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  isEdit = false;
  form: any = { employe: '', evaluateur: '', date: '', type: 'Performance', commentaire: '' };

  constructor() { super() }

  ngOnInit(): void {
    this.loadEvaluation();
  }

  loadEvaluation() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 400);
  }

  onSubmit() {
    alert(this.isEdit ? 'Évaluation modifiée' : 'Évaluation créée');
  }
}
