import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-bulletin-details-page',
  templateUrl: './bulletin-details-page.component.html',
  styleUrls: ['./bulletin-details-page.component.scss']
})
export class BulletinDetailsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
