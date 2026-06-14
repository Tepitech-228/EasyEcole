import { Component, Input, OnInit } from '@angular/core';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-parcours-card',
  templateUrl: './parcours-card.component.html',
  styleUrls: ['./parcours-card.component.scss']
})
export class ParcoursCardComponent implements OnInit {

  @Input() parcours?: Parcours

  readonly PARCOURS_PATH: string = environment.MEDIAS_PATH.ORIENTATION.PARCOURS

  constructor() { }

  ngOnInit(): void {}

  getDuree(): string {
    return Parcours.getDuree(this.parcours!.dureeDeFormation!)
  }

}
