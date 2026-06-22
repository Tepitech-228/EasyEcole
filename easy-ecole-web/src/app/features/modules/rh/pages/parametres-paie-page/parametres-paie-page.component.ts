import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-parametres-paie-page',
  templateUrl: './parametres-paie-page.component.html',
  styleUrls: ['./parametres-paie-page.component.scss']
})
export class ParametresPaiePageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
