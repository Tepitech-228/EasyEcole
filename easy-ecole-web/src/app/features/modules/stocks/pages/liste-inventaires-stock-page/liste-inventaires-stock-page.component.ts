import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { InventaireStockService } from 'src/app/data/modules/stocks/services/inventaire-stock.service';
import { InventaireStock } from 'src/app/data/modules/stocks/models/InventaireStock.model';

@Component({
  selector: 'app-liste-inventaires-stock-page',
  templateUrl: './liste-inventaires-stock-page.component.html',
  styleUrls: ['./liste-inventaires-stock-page.component.scss']
})
export class ListeInventairesStockPageComponent extends BaseComponentClass implements OnInit {
  inventaires: InventaireStock[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { notes: '' };

  constructor(
    private inventaireStockService: InventaireStockService,
  ) { super(); }

  ngOnInit(): void {
    this.getInventaires();
  }

  getInventaires(): void {
    this.loading = true;
    this.inventaireStockService.getAll().subscribe({
      next: (res) => { this.inventaires = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  ouvrirFormulaire() {
    this.formData = { notes: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerInventaire() {
    const item = new InventaireStock();
    item.notes = this.formData.notes || undefined;
    this.inventaireStockService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getInventaires(); },
      error: (err) => console.error(err)
    });
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'TERMINE': return 'bg-green-100 text-green-800';
      case 'ANNULE': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'TERMINE': return 'Terminé';
      case 'ANNULE': return 'Annulé';
      default: return 'En cours';
    }
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cet inventaire ?')) return;
    this.inventaireStockService.delete(id).subscribe({ next: () => this.getInventaires() });
  }

  trackByFn(index: number, item: InventaireStock): any { return item.id; }
}
