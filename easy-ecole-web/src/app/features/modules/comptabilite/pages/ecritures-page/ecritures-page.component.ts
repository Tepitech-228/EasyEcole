import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';

@Component({
  selector: 'app-ecritures-page',
  templateUrl: './ecritures-page.component.html',
  styleUrls: ['./ecritures-page.component.scss']
})
export class EcrituresPageComponent extends BaseComponentClass implements OnInit {
  ecritures: any[] = [];
  filteredEcritures: any[] = [];
  loading = true;
  error = false;

  filterJournal = '';
  filterStatut = '';
  dateDebut = '';
  dateFin = '';

  currentPage = 1;
  pageSize = 15;
  totalPages = 1;

  journaux: any[] = [];

  constructor(private service: ComptabiliteService) { super(); }

  ngOnInit(): void {
    this.service.getAllEcritures({}).subscribe({
      next: (data) => {
        this.ecritures = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
    this.service.getAllJournaux().subscribe({
      next: (data) => this.journaux = data
    });
  }

  applyFilters(): void {
    let filtered = [...this.ecritures];

    if (this.filterJournal) {
      filtered = filtered.filter(e => e.journal?.code === this.filterJournal);
    }
    if (this.filterStatut) {
      const isValidee = this.filterStatut === 'validee';
      filtered = filtered.filter(e => e.validee === isValidee);
    }
    if (this.dateDebut) {
      filtered = filtered.filter(e => new Date(e.dateEcriture) >= new Date(this.dateDebut));
    }
    if (this.dateFin) {
      filtered = filtered.filter(e => new Date(e.dateEcriture) <= new Date(this.dateFin));
    }

    filtered.sort((a: any, b: any) => new Date(b.dateEcriture).getTime() - new Date(a.dateEcriture).getTime());

    this.filteredEcritures = filtered;
    this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  get paginatedEcritures(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEcritures.slice(start, start + this.pageSize);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  get pages(): number[] {
    const arr: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  getStatutBadge(validee: boolean): string {
    return validee ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  }

  getJournalColor(code: string): string {
    const colors: Record<string, string> = {
      VEN: 'bg-blue-100 text-blue-700', ACH: 'bg-rose-100 text-rose-700',
      BQ: 'bg-teal-100 text-teal-700', CAI: 'bg-amber-100 text-amber-700',
      PAI: 'bg-violet-100 text-violet-700', OD: 'bg-gray-100 text-gray-700'
    };
    return colors[code] || 'bg-gray-100 text-gray-700';
  }

  formatMontant(v: number): string {
    return (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
  }
}
