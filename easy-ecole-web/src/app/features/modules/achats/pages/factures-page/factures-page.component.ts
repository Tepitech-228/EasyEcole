import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-factures-page',
  templateUrl: './factures-page.component.html',
  styleUrls: ['./factures-page.component.scss']
})
export class FacturesPageComponent extends BaseComponentClass {
  constructor() { super() }
}
