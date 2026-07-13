import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';

@Component({
  selector: 'app-grand-livre-page',
  templateUrl: './grand-livre-page.component.html',
  styleUrls: ['./grand-livre-page.component.scss']
})
export class GrandLivrePageComponent extends BaseComponentClass implements OnInit {
  comptes: any[] = [];
  selectedCompteId = '';
  selectedCompte: any = null;
  grandLivre: any = null;
  loading = true;
  loadingLivre = false;
  error = false;

  constructor(private service: ComptabiliteService) { super(); }

  ngOnInit(): void {
    this.service.getAllComptes().subscribe({
      next: (data) => { this.comptes = data; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  onCompteChange(): void {
    if (!this.selectedCompteId) {
      this.selectedCompte = null;
      this.grandLivre = null;
      return;
    }
    this.selectedCompte = this.comptes.find(c => c.id === this.selectedCompteId);
    this.loadingLivre = true;
    this.service.getGrandLivre(this.selectedCompteId).subscribe({
      next: (data) => {
        this.grandLivre = data;
        this.loadingLivre = false;
      },
      error: () => { this.grandLivre = null; this.loadingLivre = false; }
    });
  }

  get filteredComptes(): any[] {
    return this.comptes.sort((a: any, b: any) => a.numero.localeCompare(b.numero));
  }

  get soldeDebit(): number { return this.grandLivre?.soldeDebit || 0; }
  get soldeCredit(): number { return this.grandLivre?.soldeCredit || 0; }
  get solde(): number { return this.grandLivre?.solde || 0; }

  formatMontant(v: number): string {
    return (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
  }
}
