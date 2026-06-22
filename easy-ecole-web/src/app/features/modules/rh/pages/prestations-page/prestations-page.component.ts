import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-prestations-page',
  templateUrl: './prestations-page.component.html',
  styleUrls: ['./prestations-page.component.scss']
})
export class PrestationsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
