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
    id: string
    article?: Article
    error: boolean = false
    constructor(
        private articleService: ArticleService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        super()
        this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
        this.getArticle(this.id)
    }
    ngOnInit(): void {}
    getArticle(id: string): void {
        this.articleService.get(id).subscribe({
            next: (res) => { this.article = res },
            error: (err: HttpErrorResponse) => { this.error = true; if (err.status == 404) { this.router.navigate(['/stocks/articles']) } }
        })
    }
    delete(): void {
        this.articleService.delete(this.id).subscribe({
            next: () => { this.router.navigate(['/stocks/articles']) },
            error: (err) => { console.log(err) }
        })
    }
}
