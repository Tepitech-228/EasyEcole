import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { MouvementStockService } from 'src/app/data/modules/stocks/services/mouvement-stock.service';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';
import { MouvementStock } from 'src/app/data/modules/stocks/models/MouvementStock.model';

@Component({
  selector: 'app-reporting-stock-page',
  templateUrl: './reporting-stock-page.component.html',
  styleUrls: ['./reporting-stock-page.component.scss']
})
export class ReportingStockPageComponent extends BaseComponentClass implements OnInit {
  articles: Article[] = [];
  mouvements: MouvementStock[] = [];
  loading: boolean = false;

  constructor(
    private articleService: ArticleService,
    private mouvementStockService: MouvementStockService,
  ) { super(); }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.articleService.getAll().subscribe({
      next: (res) => { this.articles = res },
      error: () => this.loading = false
    });
    this.mouvementStockService.getAll().subscribe({
      next: (res) => { this.mouvements = res.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10) },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get stockTotal(): number { return this.articles.reduce((acc, a) => acc + (a.stockActuel || 0), 0) }
  get nbAlertes(): number { return this.articles.filter(a => (a.stockActuel || 0) <= (a.stockMinimum || 0)).length }
  get articlesEnAlerte(): Article[] { return this.articles.filter(a => (a.stockActuel || 0) <= (a.stockMinimum || 0)) }
  get valeurStock(): number { return this.articles.reduce((acc, a) => acc + (a.stockActuel || 0) * (a.prixUnitaire || 0), 0) }

  getArticleName(m: MouvementStock): string {
    const article = this.articles.find(a => a.id === m.articleId);
    return article?.nom || 'Article supprimé';
  }

  trackByFn(index: number, item: any): any { return item.id; }
}
