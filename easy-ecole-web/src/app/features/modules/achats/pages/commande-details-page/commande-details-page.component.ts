import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-commande-details-page',
  templateUrl: './commande-details-page.component.html',
  styleUrls: ['./commande-details-page.component.scss']
})
export class CommandeDetailsPageComponent extends BaseComponentClass {
  constructor() { super() }
}
