import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
  selector: 'app-details-article-page',
  templateUrl: './details-article-page.component.html',
  styleUrls: ['./details-article-page.component.scss']
})
export class DetailsArticlePageComponent extends BaseComponentClass implements OnInit {
  article?: Article;
  error: boolean = false;
  loading: boolean = false;

  constructor(
    private articleService: ArticleService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get("id");
    if (id) this.getArticle(id);
  }

  getArticle(id: string): void {
    this.loading = true;
    this.articleService.get(id).subscribe({
      next: (res) => { this.article = res; },
      error: (err: HttpErrorResponse) => {
        this.error = true;
        if (err.status == 404) this.router.navigate(['/stocks/articles']);
      },
      complete: () => this.loading = false
    });
  }

  delete(): void {
    if (!this.article?.id) return;
    if (!confirm('Supprimer cet article ?')) return;
    this.articleService.delete(this.article.id).subscribe({
      next: () => this.router.navigate(['/stocks/articles']),
      error: (err) => console.log(err)
    });
  }

  getStockClass(): string {
    const stock = this.article?.stockActuel || 0;
    const min = this.article?.stockMinimum || 0;
    if (stock <= min) return 'text-red-600 font-bold';
    if (stock <= min * 2) return 'text-amber-600 font-bold';
    return 'text-gray-900';
  }

  retour(): void {
    this.router.navigate(['/stocks/articles']);
  }
}
