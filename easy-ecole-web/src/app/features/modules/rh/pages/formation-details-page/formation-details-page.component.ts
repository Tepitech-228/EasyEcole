import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-formation-details-page',
  templateUrl: './formation-details-page.component.html',
  styleUrls: ['./formation-details-page.component.scss']
})
export class FormationDetailsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
