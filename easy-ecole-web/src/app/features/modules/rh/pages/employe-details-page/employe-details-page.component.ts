import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-employe-details-page',
  templateUrl: './employe-details-page.component.html',
  styleUrls: ['./employe-details-page.component.scss']
})
export class EmployeDetailsPageComponent extends BaseComponentClass implements OnInit {
  employeId: string | null = null;

  constructor(private route: ActivatedRoute) { super() }

  ngOnInit(): void {
    this.employeId = this.route.snapshot.paramMap.get('id');
  }
}
