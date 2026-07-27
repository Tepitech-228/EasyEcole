import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { TransfertStockService } from 'src/app/data/modules/stocks/services/transfert-stock.service';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { TransfertStock } from 'src/app/data/modules/stocks/models/TransfertStock.model';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
  selector: 'app-liste-transferts-stock-page',
  templateUrl: './liste-transferts-stock-page.component.html',
  styleUrls: ['./liste-transferts-stock-page.component.scss']
})
export class ListeTransfertsStockPageComponent extends BaseComponentClass implements OnInit {
  transferts: TransfertStock[] = [];
  articles: Article[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { articleId: '', sourceStockId: '', destinationStockId: '', quantite: 0, motif: '' };

  constructor(
    private transfertService: TransfertStockService,
    private articleService: ArticleService,
  ) { super(); }

  ngOnInit(): void {
    this.articleService.getAll().subscribe(data => this.articles = data);
    this.getTransferts();
  }

  getTransferts(): void {
    this.loading = true;
    this.transfertService.getAll().subscribe({
      next: (res) => { this.transferts = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get totalTransferts(): number { return this.transferts.length }
  get nbEnAttente(): number { return this.transferts.filter(t => t.statut === 'en_attente').length }
  get nbValides(): number { return this.transferts.filter(t => t.statut === 'valide').length }

  ouvrirFormulaire() {
    this.formData = { articleId: '', sourceStockId: '', destinationStockId: '', quantite: 0, motif: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerTransfert() {
    if (!this.formData.articleId || !this.formData.quantite) return;
    const item = new TransfertStock();
    item.articleId = this.formData.articleId;
    item.sourceStockId = this.formData.sourceStockId || undefined;
    item.destinationStockId = this.formData.destinationStockId || undefined;
    item.quantite = this.formData.quantite;
    item.motif = this.formData.motif || undefined;
    this.transfertService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getTransferts(); },
      error: (err) => console.error(err)
    });
  }

  annuler(id?: string) {
    if (!id) return;
    if (!confirm('Annuler ce transfert ?')) return;
    this.transfertService.annuler(id).subscribe({ next: () => this.getTransferts() });
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'en_attente': return 'bg-amber-100 text-amber-800';
      case 'valide': return 'bg-green-100 text-green-800';
      case 'annule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'valide': return 'Validé';
      case 'annule': return 'Annulé';
      default: return statut || '-';
    }
  }

  getArticleName(id?: string): string {
    const a = this.articles.find(a => a.id === id);
    return a ? a.nom! : '-';
  }

  trackByFn(index: number, item: TransfertStock): any { return item.id; }
}
