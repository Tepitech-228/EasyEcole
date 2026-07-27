import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BesoinService } from 'src/app/data/modules/stocks/services/besoin.service';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { Besoin } from 'src/app/data/modules/stocks/models/Besoin.model';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';

@Component({
  selector: 'app-liste-besoins-page',
  templateUrl: './liste-besoins-page.component.html',
  styleUrls: ['./liste-besoins-page.component.scss']
})
export class ListeBesoinsPageComponent extends BaseComponentClass implements OnInit {
  besoins: Besoin[] = [];
  articles: Article[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { articleId: '', quantiteRequise: 1, urgence: 'NORMALE', motif: '', dateSouhaitee: '' };

  constructor(
    private besoinService: BesoinService,
    private articleService: ArticleService,
  ) { super(); }

  ngOnInit(): void {
    this.articleService.getAll().subscribe(data => this.articles = data);
    this.getBesoins();
  }

  getBesoins(): void {
    this.loading = true;
    this.besoinService.getAll().subscribe({
      next: (res) => { this.besoins = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  ouvrirFormulaire() {
    this.formData = { articleId: '', quantiteRequise: 1, urgence: 'NORMALE', motif: '', dateSouhaitee: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerBesoin() {
    if (!this.formData.articleId || !this.formData.quantiteRequise) return;
    const item = new Besoin();
    item.articleId = this.formData.articleId;
    item.quantiteRequise = this.formData.quantiteRequise;
    item.urgence = this.formData.urgence;
    item.motif = this.formData.motif;
    item.dateSouhaitee = this.formData.dateSouhaitee || undefined;
    this.besoinService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getBesoins(); },
      error: (err) => console.error(err)
    });
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'bg-green-100 text-green-800';
      case 'REFUSE': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'Approuvé';
      case 'REFUSE': return 'Refusé';
      default: return 'En attente';
    }
  }

  getUrgenceClass(urgence?: string): string {
    switch (urgence) {
      case 'URGENTE': return 'text-red-600 font-semibold';
      case 'HAUTE': return 'text-amber-600';
      default: return 'text-green-600';
    }
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer ce besoin ?')) return;
    this.besoinService.delete(id).subscribe({ next: () => this.getBesoins() });
  }

  trackByFn(index: number, item: Besoin): any { return item.id; }
}
