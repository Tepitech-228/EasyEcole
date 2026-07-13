import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { CategorieArticleService } from 'src/app/data/modules/stocks/services/categorie-article.service';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';
import { CategorieArticle } from 'src/app/data/modules/stocks/models/CategorieArticle.model';

@Component({
  selector: 'app-liste-articles-page',
  templateUrl: './liste-articles-page.component.html',
  styleUrls: ['./liste-articles-page.component.scss']
})
export class ListeArticlesPageComponent extends BaseComponentClass implements OnInit {
  articles: Article[] = [];
  categories: CategorieArticle[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { nom: '', reference: '', description: '', categorieId: '', stockActuel: 0, stockMinimum: 5, prixUnitaire: '' };

  constructor(
    private articleService: ArticleService,
    private categorieService: CategorieArticleService,
  ) { super(); }

  ngOnInit(): void {
    this.categorieService.getAll().subscribe(data => this.categories = data);
    this.getArticles();
  }

  getArticles(): void {
    this.loading = true;
    this.articleService.getAll().subscribe({
      next: (res) => { this.articles = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get stockTotal(): number { return this.articles.reduce((acc, a) => acc + (a.stockActuel || 0), 0) }
  get nbAlertes(): number { return this.articles.filter(a => (a.stockActuel || 0) <= (a.stockMinimum || 0)).length }

  ouvrirFormulaire() {
    this.formData = { nom: '', reference: '', description: '', categorieId: '', stockActuel: 0, stockMinimum: 5, prixUnitaire: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerArticle() {
    if (!this.formData.nom || !this.formData.reference) return;
    const article = new Article();
    article.nom = this.formData.nom;
    article.reference = this.formData.reference;
    article.description = this.formData.description;
    article.categorieId = this.formData.categorieId || undefined;
    article.stockActuel = this.formData.stockActuel;
    article.stockMinimum = this.formData.stockMinimum;
    article.prixUnitaire = this.formData.prixUnitaire || undefined;
    this.articleService.create(article).subscribe({
      next: () => { this.fermerFormulaire(); this.getArticles(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cet article ?')) return;
    this.articleService.delete(id).subscribe({ next: () => this.getArticles() });
  }

  getStockClass(article: Article): string {
    const stock = article.stockActuel || 0;
    const min = article.stockMinimum || 0;
    if (stock <= min) return 'text-red-600 font-semibold';
    if (stock <= min * 2) return 'text-amber-600';
    return 'text-green-600';
  }

  trackByFn(index: number, item: Article): any { return item.id; }
}
