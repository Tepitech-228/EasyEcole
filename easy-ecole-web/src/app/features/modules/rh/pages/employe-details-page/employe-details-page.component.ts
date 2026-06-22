import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-employe-details-page',
  templateUrl: './employe-details-page.component.html',
  styleUrls: ['./employe-details-page.component.scss']
})
export class EmployeDetailsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
