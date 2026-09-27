import { Component, Input, OnInit } from '@angular/core';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';

@Component({
  selector: 'app-cours-card',
  templateUrl: './cours-card.component.html',
  styleUrls: ['./cours-card.component.scss']
})
export class CoursCardComponent implements OnInit {

  @Input() cours?: Cours

  readonly COURS_DETAIL_PATH = '/cours/cours';

  constructor() { }

  ngOnInit(): void {}

}
