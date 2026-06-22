import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-receptions-page',
  templateUrl: './receptions-page.component.html',
  styleUrls: ['./receptions-page.component.scss']
})
export class ReceptionsPageComponent extends BaseComponentClass {
  constructor() { super() }
}
