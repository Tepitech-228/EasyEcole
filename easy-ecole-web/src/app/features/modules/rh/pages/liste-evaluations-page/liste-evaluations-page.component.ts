import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-evaluations-page',
  templateUrl: './liste-evaluations-page.component.html',
  styleUrls: ['./liste-evaluations-page.component.scss']
})
export class ListeEvaluationsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
