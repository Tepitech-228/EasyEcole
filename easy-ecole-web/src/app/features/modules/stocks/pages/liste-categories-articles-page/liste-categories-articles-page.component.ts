import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CategorieArticleService } from 'src/app/data/modules/stocks/services/categorie-article.service';
import { CategorieArticle } from 'src/app/data/modules/stocks/models/CategorieArticle.model';

@Component({
  selector: 'app-liste-categories-articles-page',
  templateUrl: './liste-categories-articles-page.component.html',
  styleUrls: ['./liste-categories-articles-page.component.scss']
})
export class ListeCategoriesArticlesPageComponent extends BaseComponentClass implements OnInit {
  categories: CategorieArticle[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { nom: '', description: '' };

  constructor(
    private categorieService: CategorieArticleService,
  ) { super(); }

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.loading = true;
    this.categorieService.getAll().subscribe({
      next: (res) => { this.categories = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  ouvrirFormulaire() {
    this.formData = { nom: '', description: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerCategorie() {
    if (!this.formData.nom) return;
    const item = new CategorieArticle();
    item.nom = this.formData.nom;
    item.description = this.formData.description || undefined;
    this.categorieService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getCategories(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette catégorie ?')) return;
    this.categorieService.delete(id).subscribe({ next: () => this.getCategories() });
  }

  trackByFn(index: number, item: CategorieArticle): any { return item.id; }
}
