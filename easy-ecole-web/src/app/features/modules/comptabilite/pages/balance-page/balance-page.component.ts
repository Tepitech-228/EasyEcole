import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';

@Component({
  selector: 'app-balance-page',
  templateUrl: './balance-page.component.html',
  styleUrls: ['./balance-page.component.scss']
})
export class BalancePageComponent extends BaseComponentClass implements OnInit {
  balance: any[] = [];
  filteredBalance: any[] = [];
  loading = true;
  error = false;
  totalDebit = 0;
  totalCredit = 0;
  maxMontant = 0;
  selectedClasse = '';

  classesLibelles: Record<string, string> = {
    '1': 'Financement', '2': 'Actif immobilisé', '3': 'Actif circulant',
    '4': 'Passif circulant', '5': 'Trésorerie', '6': 'Charges',
    '7': 'Revenus', '8': 'Spéciaux'
  };

  constructor(private service: ComptabiliteService) { super(); }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.service.getBalance().subscribe({
      next: (data) => {
        this.balance = data;
        this.filter();
        this.calculateTotals();
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  filter(): void {
    this.filteredBalance = this.selectedClasse
      ? this.balance.filter(b => b.compte?.classe === this.selectedClasse)
      : [...this.balance];
    this.maxMontant = Math.max(
      ...this.filteredBalance.map(b => Math.max(b.debit || 0, b.credit || 0)),
      1
    );
    this.calculateTotals();
  }

  private calculateTotals(): void {
    this.totalDebit = this.filteredBalance.reduce((s, b) => s + (b.debit || 0), 0);
    this.totalCredit = this.filteredBalance.reduce((s, b) => s + (b.credit || 0), 0);
  }

  getSolde(item: any): number {
    return (item.debit || 0) - (item.credit || 0);
  }

  getBarWidth(v: number): string {
    return Math.round((v / this.maxMontant) * 100) + '%';
  }

  formatMontant(v: number): string {
    return v.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
  }

  getClasses(): string[] {
    return Object.keys(this.classesLibelles);
  }

  isEquilibree(): boolean {
    return Math.abs(this.totalDebit - this.totalCredit) < 1;
  }

  get Math() { return Math; }
}
