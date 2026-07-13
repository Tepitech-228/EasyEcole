import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-validations-page',
  templateUrl: './validations-page.component.html',
  styleUrls: ['./validations-page.component.scss']
})
export class ValidationsPageComponent extends BaseComponentClass {
  constructor() { super() }
}
