import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';

@Component({
  selector: 'app-dashboard-comptable-page',
  templateUrl: './dashboard-comptable-page.component.html',
  styleUrls: ['./dashboard-comptable-page.component.scss']
})
export class DashboardComptablePageComponent extends BaseComponentClass implements OnInit {
  loading = true;
  error = false;

  totalActif = 0;
  totalPassif = 0;
  totalProduits = 0;
  totalCharges = 0;
  nbEcritures = 0;
  nbComptes = 0;
  dernieresEcritures: any[] = [];

  constructor(private service: ComptabiliteService) { super(); }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.service.getAllComptes().subscribe({
      next: (comptes) => {
        this.nbComptes = comptes.length;
        this.totalActif = comptes
          .filter(c => ['2', '3'].includes(c.classe))
          .reduce((s, c) => s + (c as any).solde || 0, 0);
        this.totalPassif = comptes
          .filter(c => ['1', '4'].includes(c.classe))
          .reduce((s, c) => s + (c as any).solde || 0, 0);
        this.totalProduits = comptes
          .filter(c => c.classe === '7')
          .reduce((s, c) => s + (c as any).solde || 0, 0);
        this.totalCharges = comptes
          .filter(c => c.classe === '6')
          .reduce((s, c) => s + (c as any).solde || 0, 0);
      },
      error: () => this.error = true
    });

    this.service.getAllEcritures({ validee: true }).subscribe({
      next: (ecritures) => {
        this.nbEcritures = ecritures.length;
        this.dernieresEcritures = ecritures.slice(0, 5);
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  formatMontant(v: number): string {
    return (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
  }
}
