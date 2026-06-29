import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Router } from '@angular/router';

interface EchelleNote {
  id: number;
  nom: string;
  noteMin: number;
  noteMax: number;
  mention: string;
  actif: boolean;
}

@Component({
  selector: 'app-echelles-page',
  templateUrl: './echelles-page.component.html',
  styleUrls: ['./echelles-page.component.scss']
})
export class EchellesPageComponent extends BaseComponentClass implements OnInit {
  echelles: EchelleNote[] = [
    { id: 1, nom: 'Excellent', noteMin: 18, noteMax: 20, mention: 'Très bien', actif: true },
    { id: 2, nom: 'Très bien', noteMin: 16, noteMax: 17.99, mention: 'Bien', actif: true },
    { id: 3, nom: 'Bien', noteMin: 14, noteMax: 15.99, mention: 'Assez bien', actif: true },
    { id: 4, nom: 'Assez bien', noteMin: 12, noteMax: 13.99, mention: 'Passable', actif: true },
    { id: 5, nom: 'Passable', noteMin: 10, noteMax: 11.99, mention: 'Suffisant', actif: true },
    { id: 6, nom: 'Insuffisant', noteMin: 8, noteMax: 9.99, mention: 'Insuffisant', actif: false },
    { id: 7, nom: 'Faible', noteMin: 0, noteMax: 7.99, mention: 'Très insuffisant', actif: false },
  ];

  loading: boolean = false;

  constructor(private router: Router) { super(); }

  ngOnInit(): void {}

  supprimer(id: number): void {
    this.echelles = this.echelles.filter(e => e.id !== id);
  }

  basculerStatut(id: number): void {
    const echelle = this.echelles.find(e => e.id === id);
    if (echelle) echelle.actif = !echelle.actif;
  }

  trackByFn(index: number, item: EchelleNote): number {
    return item.id;
  }
}
