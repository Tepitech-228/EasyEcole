import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-offre-details-page',
  templateUrl: './offre-details-page.component.html',
  styleUrls: ['./offre-details-page.component.scss']
})
export class OffreDetailsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
