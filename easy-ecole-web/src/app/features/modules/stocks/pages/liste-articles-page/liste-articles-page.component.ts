import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
    selector: 'app-liste-articles-page',
    templateUrl: './liste-articles-page.component.html',
    styleUrls: ['./liste-articles-page.component.scss']
})
export class ListeArticlesPageComponent extends BaseComponentClass implements OnInit {
    articles: Article[] = []
    constructor(private articleService: ArticleService) {
        super()
        this.getArticles()
    }
    ngOnInit(): void {}
    getArticles(): void {
        this.articleService.getAll().subscribe({
            next: (res) => { this.articles = res },
            error: (err) => { console.log(err) }
        })
    }
}
