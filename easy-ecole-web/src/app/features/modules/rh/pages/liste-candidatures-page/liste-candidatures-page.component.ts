import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-candidatures-page',
  templateUrl: './liste-candidatures-page.component.html',
  styleUrls: ['./liste-candidatures-page.component.scss']
})
export class ListeCandidaturesPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  candidatures: any[] = [];
  filterStatut = '';

  constructor() { super() }

  ngOnInit(): void {
    this.loadCandidatures();
  }

  loadCandidatures() {
    this.loading = true;
    setTimeout(() => {
      this.candidatures = [
        { id: 1, candidat: 'Dupont Jean', offre: 'Développeur Angular', date: '2026-01-20', statut: 'soumise' },
        { id: 2, candidat: 'Martin Marie', offre: 'Comptable', date: '2026-01-22', statut: 'étudiée' },
        { id: 3, candidat: 'Bernard Luc', offre: 'Développeur Angular', date: '2026-01-21', statut: 'retenue' },
      ];
      this.loading = false;
    }, 500);
  }

  getStatutBadge(statut: string): string {
    const map: any = { soumise: 'bg-yellow-100 text-yellow-700', étudiée: 'bg-blue-100 text-blue-700', retenue: 'bg-green-100 text-green-700', rejetée: 'bg-red-100 text-red-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }
}
