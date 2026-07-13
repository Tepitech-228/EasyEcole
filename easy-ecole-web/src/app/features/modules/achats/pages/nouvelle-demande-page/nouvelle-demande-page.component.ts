import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-nouvelle-demande-page',
  templateUrl: './nouvelle-demande-page.component.html',
  styleUrls: ['./nouvelle-demande-page.component.scss']
})
export class NouvelleDemandePageComponent extends BaseComponentClass {
  constructor() { super() }
}
