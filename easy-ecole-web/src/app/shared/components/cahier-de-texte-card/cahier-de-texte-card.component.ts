import { Component, Input, OnInit } from '@angular/core';
import { CahierDeTexte } from 'src/app/data/modules/inscription/models/CahierDeTexte.model';

@Component({
  selector: 'app-cahier-de-texte-card',
  templateUrl: './cahier-de-texte-card.component.html',
  styleUrls: ['./cahier-de-texte-card.component.scss']
})
export class CahierDeTexteCardComponent implements OnInit {

  @Input() cahierDeTexte?: CahierDeTexte

  constructor() { }

  ngOnInit(): void {
  }

}
