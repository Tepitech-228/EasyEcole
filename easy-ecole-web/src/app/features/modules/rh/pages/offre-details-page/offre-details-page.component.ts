import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-offre-details-page',
  templateUrl: './offre-details-page.component.html',
  styleUrls: ['./offre-details-page.component.scss']
})
export class OffreDetailsPageComponent extends BaseComponentClass implements OnInit {
  offreId: string | null = null;

  constructor(private route: ActivatedRoute) { super() }

  ngOnInit(): void {
    this.offreId = this.route.snapshot.paramMap.get('id');
  }
}
