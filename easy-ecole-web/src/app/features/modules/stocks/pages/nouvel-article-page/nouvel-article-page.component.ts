import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
    selector: 'app-nouvel-article-page',
    templateUrl: './nouvel-article-page.component.html',
    styleUrls: ['./nouvel-article-page.component.scss']
})
export class NouvelArticlePageComponent extends BaseComponentClass implements OnInit {
    error: boolean = false
    disableButton: boolean = false
    alreadyExists: boolean = false
    form: FormGroup = new FormGroup({
        nom: new FormControl(null, [Validators.required]),
        reference: new FormControl(null, [Validators.required]),
        description: new FormControl(null, []),
        stockMinimum: new FormControl(null, []),
        prixUnitaire: new FormControl(null, []),
    })
    constructor(private router: Router, private articleService: ArticleService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isCaissierBanque) { this.router.navigate(['/stocks/articles']) }
    }
    ngOnInit(): void {}
    create(): void {
        this.form.markAllAsTouched()
        if (this.form.valid) {
            let article = new Article()
            article.nom = this.form.get('nom')!.value
            article.reference = this.form.get('reference')!.value
            article.description = this.form.get('description')!.value
            article.stockMinimum = this.form.get('stockMinimum')!.value
            article.prixUnitaire = this.form.get('prixUnitaire')!.value
            this.disableButton = true
            this.articleService.create(article).subscribe({
                next: () => { this.router.navigateByUrl("/stocks/articles") },
                error: (err: HttpErrorResponse) => {
                    this.alreadyExists = err.error?.alreadyExists
                    if (!this.alreadyExists) { this.error = true }
                    setTimeout(() => { this.error = false; this.alreadyExists = false }, 3000)
                },
                complete: () => { this.disableButton = false }
            })
        }
    }
}
