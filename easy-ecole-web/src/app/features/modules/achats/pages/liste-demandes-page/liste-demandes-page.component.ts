import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass {
  demandes: any[] = []
  constructor() { super() }
}
