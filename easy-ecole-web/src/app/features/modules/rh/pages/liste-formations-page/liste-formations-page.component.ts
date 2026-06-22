import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-formations-page',
  templateUrl: './liste-formations-page.component.html',
  styleUrls: ['./liste-formations-page.component.scss']
})
export class ListeFormationsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
