import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface Bareme {
  id: string
  nom: string
  noteMin: number
  noteMax: number
  mention: string
  appreciation: string
}

@Component({
  selector: 'app-baremes-page',
  templateUrl: './baremes-page.component.html',
  styleUrls: ['./baremes-page.component.scss']
})
export class BaremesPageComponent extends BaseComponentClass {
  baremes: Bareme[] = [
    { id: '1', nom: 'Excellent', noteMin: 16, noteMax: 20, mention: 'TB', appreciation: 'Très bien' },
    { id: '2', nom: 'Bien', noteMin: 14, noteMax: 15.99, mention: 'B', appreciation: 'Bien' },
    { id: '3', nom: 'Assez bien', noteMin: 12, noteMax: 13.99, mention: 'AB', appreciation: 'Assez bien' },
    { id: '4', nom: 'Passable', noteMin: 10, noteMax: 11.99, mention: 'P', appreciation: 'Passable' },
    { id: '5', nom: 'Insuffisant', noteMin: 8, noteMax: 9.99, mention: 'I', appreciation: 'Insuffisant' },
    { id: '6', nom: 'Faible', noteMin: 0, noteMax: 7.99, mention: 'F', appreciation: 'Faible' },
  ]
  loading: boolean = false

  constructor() { super() }
}
