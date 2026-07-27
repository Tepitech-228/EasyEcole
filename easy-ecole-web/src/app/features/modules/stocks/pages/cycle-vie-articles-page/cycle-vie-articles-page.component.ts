import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
  selector: 'app-cycle-vie-articles-page',
  templateUrl: './cycle-vie-articles-page.component.html',
  styleUrls: ['./cycle-vie-articles-page.component.scss']
})
export class CycleVieArticlesPageComponent extends BaseComponentClass implements OnInit {
  articles: Article[] = [];
  loading: boolean = false;
  inlineForm: { [id: string]: { statut: string; motifFinVie: string } } = {};

  statutOptions = ['actif', 'obsolete', 'reforme', 'en_rupture'];

  get actifsCount(): number { return this.articles.filter(a => a.statut === 'actif').length; }
  get obsoletesCount(): number { return this.articles.filter(a => a.statut === 'obsolete').length; }
  get reformesCount(): number { return this.articles.filter(a => a.statut === 'reforme').length; }
  get enRuptureCount(): number { return this.articles.filter(a => a.statut === 'en_rupture').length; }

  constructor(
    private articleService: ArticleService,
  ) { super(); }

  ngOnInit(): void {
    this.getArticles();
  }

  getArticles(): void {
    this.loading = true;
    this.articleService.getAll().subscribe({
      next: (res) => {
        this.articles = res;
        this.articles.forEach(a => this.inlineForm[a.id!] = { statut: a.statut || 'actif', motifFinVie: a.motifFinVie || '' });
        this.loading = false;
      },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  getStatutBadgeClass(statut: string): string {
    const map: any = {
      actif: 'bg-green-100 text-green-800',
      obsolete: 'bg-orange-100 text-orange-800',
      reforme: 'bg-red-100 text-red-800',
      en_rupture: 'bg-amber-100 text-amber-800'
    };
    return map[statut] || 'bg-gray-100 text-gray-800';
  }

  getStatutLabel(statut: string): string {
    const map: any = {
      actif: 'Actif',
      obsolete: 'Obsolète',
      reforme: 'Réformé',
      en_rupture: 'En rupture'
    };
    return map[statut] || statut;
  }

  onStatutChange(article: Article): void {
    const form = this.inlineForm[article.id!];
    if (!form) return;
    const newStatut = form.statut;
    if (newStatut === article.statut) return;
    if (newStatut === 'reforme' || newStatut === 'obsolete') {
      return;
    }
    this.saveStatut(article);
  }

  saveStatut(article: Article): void {
    const form = this.inlineForm[article.id!];
    if (!form) return;
    const newStatut = form.statut;
    if (newStatut === article.statut) return;
    const motif = (newStatut === 'reforme' || newStatut === 'obsolete') ? form.motifFinVie : undefined;
    const msg = `Changer le statut de "${article.nom}" vers "${this.getStatutLabel(newStatut)}" ?`;
    if (!confirm(msg)) return;
    this.articleService.updateStatut(article.id!, newStatut, motif).subscribe({
      next: () => {
        this.inlineForm[article.id!] = { statut: newStatut, motifFinVie: '' };
        this.getArticles();
      },
      error: (err) => console.error(err)
    });
  }

  trackByFn(index: number, item: Article): any { return item.id; }
}
