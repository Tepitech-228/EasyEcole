import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-formations-page',
  templateUrl: './liste-formations-page.component.html',
  styleUrls: ['./liste-formations-page.component.scss']
})
export class ListeFormationsPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  formations: any[] = [];

  constructor() { super() }

  ngOnInit(): void {
    this.loadFormations();
  }

  loadFormations() {
    this.loading = true;
    setTimeout(() => {
      this.formations = [
        { id: 1, titre: 'Angular Avancé', formateur: 'Jean Dupont', debut: '2026-02-01', fin: '2026-02-15', type: 'interne' },
        { id: 2, titre: 'Gestion de projet', formateur: 'Marie Martin', debut: '2026-03-01', fin: '2026-03-10', type: 'externe' },
      ];
      this.loading = false;
    }, 500);
  }

  getTypeBadge(type: string): string {
    const map: any = { interne: 'bg-indigo-100 text-indigo-700', externe: 'bg-teal-100 text-teal-700', en_ligne: 'bg-purple-100 text-purple-700' };
    return map[type] || 'bg-gray-100 text-gray-700';
  }
}
