import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-prestations-page',
  templateUrl: './prestations-page.component.html',
  styleUrls: ['./prestations-page.component.scss']
})
export class PrestationsPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  prestations: any[] = [];

  constructor() { super() }

  ngOnInit(): void {
    this.loadPrestations();
  }

  loadPrestations() {
    this.loading = true;
    setTimeout(() => {
      this.prestations = [
        { id: 1, enseignant: 'Jean Dupont', mois: 'Janvier 2026', heures: 12, tauxHoraire: 5000, montant: 60000, statut: 'payee' },
        { id: 2, enseignant: 'Marie Martin', mois: 'Janvier 2026', heures: 8, tauxHoraire: 4500, montant: 36000, statut: 'en_attente' },
      ];
      this.loading = false;
    }, 500);
  }

  getStatutBadge(statut: string): string {
    const map: any = { payee: 'bg-green-100 text-green-700', en_attente: 'bg-yellow-100 text-yellow-700', rejetee: 'bg-red-100 text-red-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }
}
