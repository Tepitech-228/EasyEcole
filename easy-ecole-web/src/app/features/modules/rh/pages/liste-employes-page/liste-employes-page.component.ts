import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-employes-page',
  templateUrl: './liste-employes-page.component.html',
  styleUrls: ['./liste-employes-page.component.scss']
})
export class ListeEmployesPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
