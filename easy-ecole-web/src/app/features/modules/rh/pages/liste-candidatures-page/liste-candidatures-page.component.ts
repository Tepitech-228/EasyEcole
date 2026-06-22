import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-candidatures-page',
  templateUrl: './liste-candidatures-page.component.html',
  styleUrls: ['./liste-candidatures-page.component.scss']
})
export class ListeCandidaturesPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
