import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-details-demande-page',
  templateUrl: './details-demande-page.component.html',
  styleUrls: ['./details-demande-page.component.scss']
})
export class DetailsDemandePageComponent extends BaseComponentClass {
  constructor() { super() }
}
