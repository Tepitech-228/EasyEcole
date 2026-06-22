import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-fournisseurs-page',
  templateUrl: './fournisseurs-page.component.html',
  styleUrls: ['./fournisseurs-page.component.scss']
})
export class FournisseursPageComponent extends BaseComponentClass {
  constructor() { super() }
}
