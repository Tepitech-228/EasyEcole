import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-commandes-page',
  templateUrl: './liste-commandes-page.component.html',
  styleUrls: ['./liste-commandes-page.component.scss']
})
export class ListeCommandesPageComponent extends BaseComponentClass {
  constructor() { super() }
}
