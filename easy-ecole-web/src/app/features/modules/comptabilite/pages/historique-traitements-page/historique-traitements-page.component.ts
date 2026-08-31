import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CabinetComptableService } from 'src/app/data/modules/comptabilite/services/cabinet-comptable.service';

@Component({
  selector: 'app-historique-traitements-page',
  templateUrl: './historique-traitements-page.component.html',
  styleUrls: ['./historique-traitements-page.component.scss']
})
export class HistoriqueTraitementsPageComponent extends BaseComponentClass implements OnInit {
  traitements: any[] = [];
  loading = true;
  searchTerm = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  constructor(private cabinetService: CabinetComptableService) { super(); }

  ngOnInit(): void { this.loadHistorique(); }

  private loadHistorique(): void {
    this.loading = true;
    this.cabinetService.getHistorique(this.page, this.limit).subscribe({
      next: (res: any) => {
        this.traitements = res.data || [];
        this.total = res.pagination?.total || 0;
        this.totalPages = res.pagination?.totalPages || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get traitementsFiltres(): any[] {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) return this.traitements;
    return this.traitements.filter(t => {
      const etudiant = ${t.utilisateur?.nom ?? ''} .toLowerCase();
      return etudiant.includes(q);
    });
  }

  getStatutLabel(statut: string): string {
    const map: any = { 'valide': 'Validé', 'rejete': 'Rejeté', 'traite': 'Traité' };
    return map[statut] || statut;
  }

  getStatutColor(statut: string): string {
    const map: any = { 'valide': 'text-green-600 bg-green-50', 'rejete': 'text-red-600 bg-red-50', 'traite': 'text-blue-600 bg-blue-50' };
    return map[statut] || 'text-gray-600 bg-gray-50';
  }

  formatCurrency(value: number | undefined | null): string {
    if (value == null) return '---';
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }
}
