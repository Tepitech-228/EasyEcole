import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CorrectionStockService } from 'src/app/data/modules/stocks/services/correction-stock.service';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { CorrectionStock } from 'src/app/data/modules/stocks/models/CorrectionStock.model';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
  selector: 'app-liste-corrections-stock-page',
  templateUrl: './liste-corrections-stock-page.component.html',
  styleUrls: ['./liste-corrections-stock-page.component.scss']
})
export class ListeCorrectionsStockPageComponent extends BaseComponentClass implements OnInit {
  corrections: CorrectionStock[] = [];
  articles: Article[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { articleId: '', quantiteApres: 0, motif: '', typeCorrection: 'AJUSTEMENT' };
  selectedArticleStock: number = 0;

  constructor(
    private correctionStockService: CorrectionStockService,
    private articleService: ArticleService,
  ) { super(); }

  ngOnInit(): void {
    this.articleService.getAll().subscribe(data => this.articles = data);
    this.getCorrections();
  }

  getCorrections(): void {
    this.loading = true;
    this.correctionStockService.getAll().subscribe({
      next: (res) => { this.corrections = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  onArticleChange(articleId: string): void {
    const article = this.articles.find(a => a.id === articleId);
    this.selectedArticleStock = article?.stockActuel || 0;
    this.formData.quantiteApres = this.selectedArticleStock;
  }

  ouvrirFormulaire() {
    this.formData = { articleId: '', quantiteApres: 0, motif: '', typeCorrection: 'AJUSTEMENT' };
    this.selectedArticleStock = 0;
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerCorrection() {
    if (!this.formData.articleId || this.formData.quantiteApres == null) return;
    const item = new CorrectionStock();
    item.articleId = this.formData.articleId;
    item.quantiteAvant = this.selectedArticleStock;
    item.quantiteApres = this.formData.quantiteApres;
    item.motif = this.formData.motif;
    item.typeCorrection = this.formData.typeCorrection;
    this.correctionStockService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getCorrections(); },
      error: (err) => console.error(err)
    });
  }

  getDifference(c: CorrectionStock): number {
    return (c.quantiteApres || 0) - (c.quantiteAvant || 0);
  }

  getTypeClass(type?: string): string {
    switch (type) {
      case 'PERTE': return 'bg-red-100 text-red-800';
      case 'SURPLUS': return 'bg-green-100 text-green-800';
      case 'ERREUR': return 'bg-amber-100 text-amber-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette correction ?')) return;
    this.correctionStockService.delete(id).subscribe({ next: () => this.getCorrections() });
  }

  trackByFn(index: number, item: CorrectionStock): any { return item.id; }
}
