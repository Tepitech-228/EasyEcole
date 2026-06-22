import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-dashboard-rh-page',
  templateUrl: './dashboard-rh-page.component.html',
  styleUrls: ['./dashboard-rh-page.component.scss']
})
export class DashboardRhPageComponent extends BaseComponentClass implements OnInit {

  constructor() {
    super()
  }

  ngOnInit(): void {
  }
}
