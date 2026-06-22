import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-budgets-page',
  templateUrl: './budgets-page.component.html',
  styleUrls: ['./budgets-page.component.scss']
})
export class BudgetsPageComponent extends BaseComponentClass {
  constructor() { super() }
}
