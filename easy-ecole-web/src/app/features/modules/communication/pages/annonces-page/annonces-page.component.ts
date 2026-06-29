import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-annonces-page',
  templateUrl: './annonces-page.component.html',
  styleUrls: ['./annonces-page.component.scss']
})
export class AnnoncesPageComponent extends BaseComponentClass implements OnInit {
  annonces: any[] = [];

  constructor() {
    super();
  }

  ngOnInit(): void {
    const stored = localStorage.getItem('communication_annonces');
    if (stored) {
      this.annonces = JSON.parse(stored);
    } else {
      this.annonces = [
        { id: 1, titre: 'Journée portes ouvertes', contenu: 'La journée portes ouvertes aura lieu le 15 septembre 2026.', auteur: 'Direction', date: new Date(2026, 5, 21) },
        { id: 2, titre: 'Calendrier des examens', contenu: 'Le calendrier des examens du semestre 1 est disponible.', auteur: 'Service Scolarité', date: new Date(2026, 5, 19) },
        { id: 3, titre: 'Nouveau partenariat', contenu: 'EasyEcole signe un partenariat avec 5 universités internationales.', auteur: 'Direction', date: new Date(2026, 5, 16) }
      ];
      localStorage.setItem('communication_annonces', JSON.stringify(this.annonces));
    }
  }

  supprimerAnnonce(id: number): void {
    this.annonces = this.annonces.filter(a => a.id !== id);
    localStorage.setItem('communication_annonces', JSON.stringify(this.annonces));
  }
}
