import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-discussions-page',
  templateUrl: './discussions-page.component.html',
  styleUrls: ['./discussions-page.component.scss']
})
export class DiscussionsPageComponent extends BaseComponentClass implements OnInit {
  discussions: any[] = [];

  constructor() {
    super();
  }

  ngOnInit(): void {
    const stored = localStorage.getItem('communication_discussions');
    if (stored) {
      this.discussions = JSON.parse(stored);
    } else {
      this.discussions = [
        { id: 1, titre: 'Préparation aux examens de fin d\'année', auteur: 'Alice', nbMessages: 12, derniereActivite: new Date(2026, 5, 22, 14, 30) },
        { id: 2, titre: 'Proposition d\'activités parascolaires', auteur: 'Bob', nbMessages: 8, derniereActivite: new Date(2026, 5, 21, 11, 0) },
        { id: 3, titre: 'Questions sur le nouveau programme', auteur: 'Charlie', nbMessages: 5, derniereActivite: new Date(2026, 5, 19, 16, 45) },
        { id: 4, titre: 'Projet de club de robotique', auteur: 'Diana', nbMessages: 15, derniereActivite: new Date(2026, 5, 18, 9, 20) }
      ];
      localStorage.setItem('communication_discussions', JSON.stringify(this.discussions));
    }
  }
}
