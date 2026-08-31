import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';

@Component({
  selector: 'app-bordereaux-rejetes-page',
  templateUrl: './bordereaux-rejetes-page.component.html',
  styleUrls: ['./bordereaux-rejetes-page.component.scss']
})
export class BordereauxRejetesPageComponent extends BaseComponentClass implements OnInit {
  bordereaux: Bordereau[] = [];
  loading = true;
  searchTerm = '';

  constructor(private bordereauService: BordereauService) { super(); }

  ngOnInit(): void { this.loadBordereaux(); }

  private loadBordereaux(): void {
    this.loading = true;
    this.bordereauService.getAll({ statut: 'rejete' }).subscribe({
      next: (res: any) => { this.bordereaux = res.data || res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get bordereauxFiltres(): Bordereau[] {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) return this.bordereaux;
    return this.bordereaux.filter(b => {
      const etudiant = ${b.utilisateur?.nom ?? ''} .toLowerCase();
      return etudiant.includes(q);
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value == null) return '---';
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }
}
