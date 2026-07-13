import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-paie-page',
  templateUrl: './paie-page.component.html',
  styleUrls: ['./paie-page.component.scss']
})
export class PaiePageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
