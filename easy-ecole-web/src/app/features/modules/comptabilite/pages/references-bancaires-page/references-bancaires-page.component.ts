import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CabinetComptableService } from 'src/app/data/modules/comptabilite/services/cabinet-comptable.service';

@Component({
  selector: 'app-references-bancaires-page',
  templateUrl: './references-bancaires-page.component.html',
  styleUrls: ['./references-bancaires-page.component.scss']
})
export class ReferencesBancairesPageComponent extends BaseComponentClass implements OnInit {
  references: any[] = [];
  loading = true;
  searchTerm = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  constructor(private cabinetService: CabinetComptableService) { super(); }

  ngOnInit(): void { this.loadReferences(); }

  private loadReferences(): void {
    this.loading = true;
    this.cabinetService.getReferences(this.page, this.limit).subscribe({
      next: (res: any) => {
        this.references = res.data || [];
        this.total = res.pagination?.total || 0;
        this.totalPages = res.pagination?.totalPages || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get referencesFiltres(): any[] {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) return this.references;
    return this.references.filter(r => {
      const etudiant = ${r.utilisateur?.nom ?? ''} .toLowerCase();
      const ref = (r.referenceBancaire || '').toLowerCase();
      return etudiant.includes(q) || ref.includes(q);
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value == null) return '---';
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }
}
