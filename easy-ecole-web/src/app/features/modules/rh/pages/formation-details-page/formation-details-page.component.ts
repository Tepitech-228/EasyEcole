import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-formation-details-page',
  templateUrl: './formation-details-page.component.html',
  styleUrls: ['./formation-details-page.component.scss']
})
export class FormationDetailsPageComponent extends BaseComponentClass implements OnInit {
  formationId: string | null = null;

  constructor(private route: ActivatedRoute) { super() }

  ngOnInit(): void {
    this.formationId = this.route.snapshot.paramMap.get('id');
  }
}
