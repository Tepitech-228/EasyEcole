import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-candidature-details-page',
  templateUrl: './candidature-details-page.component.html',
  styleUrls: ['./candidature-details-page.component.scss']
})
export class CandidatureDetailsPageComponent extends BaseComponentClass implements OnInit {

  constructor() { super() }

  ngOnInit(): void {
  }
}
