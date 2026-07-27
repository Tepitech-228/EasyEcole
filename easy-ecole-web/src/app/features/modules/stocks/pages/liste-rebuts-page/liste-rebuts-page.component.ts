import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RebutService } from 'src/app/data/modules/stocks/services/rebut.service';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { Rebut } from 'src/app/data/modules/stocks/models/Rebut.model';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
  selector: 'app-liste-rebuts-page',
  templateUrl: './liste-rebuts-page.component.html',
  styleUrls: ['./liste-rebuts-page.component.scss']
})
export class ListeRebutsPageComponent extends BaseComponentClass implements OnInit {
  rebuts: Rebut[] = [];
  articles: Article[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { articleId: '', quantite: 1, motif: '' };

  constructor(
    private rebutService: RebutService,
    private articleService: ArticleService,
  ) { super(); }

  ngOnInit(): void {
    this.articleService.getAll().subscribe(data => this.articles = data);
    this.getRebuts();
  }

  getRebuts(): void {
    this.loading = true;
    this.rebutService.getAll().subscribe({
      next: (res) => { this.rebuts = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  ouvrirFormulaire() {
    this.formData = { articleId: '', quantite: 1, motif: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerRebut() {
    if (!this.formData.articleId || !this.formData.quantite) return;
    const item = new Rebut();
    item.articleId = this.formData.articleId;
    item.quantite = this.formData.quantite;
    item.motif = this.formData.motif;
    this.rebutService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getRebuts(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer ce rebut ?')) return;
    this.rebutService.delete(id).subscribe({ next: () => this.getRebuts() });
  }

  trackByFn(index: number, item: Rebut): any { return item.id; }
}
