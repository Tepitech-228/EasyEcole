import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-offres-page',
  templateUrl: './liste-offres-page.component.html',
  styleUrls: ['./liste-offres-page.component.scss']
})
export class ListeOffresPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
