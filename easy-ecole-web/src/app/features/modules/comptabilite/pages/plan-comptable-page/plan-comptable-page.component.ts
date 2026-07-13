import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';

@Component({
  selector: 'app-plan-comptable-page',
  templateUrl: './plan-comptable-page.component.html',
  styleUrls: ['./plan-comptable-page.component.scss']
})
export class PlanComptablePageComponent extends BaseComponentClass implements OnInit {
  comptes: any[] = [];
  filteredComptes: any[] = [];
  searchQuery = '';
  loading = true;
  error = false;
  expandedClasses: Set<string> = new Set();

  classesLibelles: Record<string, string> = {
    '1': 'Financement permanent', '2': 'Actif immobilisé', '3': 'Actif circulant',
    '4': 'Passif circulant', '5': 'Trésorerie', '6': 'Charges',
    '7': 'Revenus', '8': 'Comptes spéciaux', '9': 'Comptes analytiques'
  };
  classeColors: Record<string, string> = {
    '1': 'bg-sky-100 text-sky-700 border-sky-200', '2': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    '3': 'bg-cyan-100 text-cyan-700 border-cyan-200', '4': 'bg-amber-100 text-amber-700 border-amber-200',
    '5': 'bg-teal-100 text-teal-700 border-teal-200', '6': 'bg-rose-100 text-rose-700 border-rose-200',
    '7': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '8': 'bg-gray-100 text-gray-700 border-gray-200', '9': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  constructor(private service: ComptabiliteService) { super(); }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.service.getAllComptes().subscribe({
      next: (data) => {
        this.comptes = data;
        this.filteredComptes = data;
        this.loading = false;
        this.expandedClasses.add('6');
        this.expandedClasses.add('7');
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  filter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.filteredComptes = this.comptes; return; }
    this.filteredComptes = this.comptes.filter(c =>
      c.numero.toLowerCase().includes(q) || c.libelle.toLowerCase().includes(q)
    );
  }

  getClasses(): string[] {
    const classes = new Set(this.filteredComptes.map(c => c.classe));
    return Object.keys(this.classesLibelles).filter(c => classes.has(c));
  }

  getComptesByClasse(classe: string): any[] {
    return this.filteredComptes.filter(c => c.classe === classe)
      .sort((a: any, b: any) => a.numero.localeCompare(b.numero));
  }

  toggleClasse(classe: string): void {
    if (this.expandedClasses.has(classe)) this.expandedClasses.delete(classe);
    else this.expandedClasses.add(classe);
  }

  getClasseCount(classe: string): number {
    return this.comptes.filter(c => c.classe === classe).length;
  }

  getSolde(compte: any): number {
    return (compte as any).solde || 0;
  }

  formatMontant(v: number): string {
    return v.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
  }
}
