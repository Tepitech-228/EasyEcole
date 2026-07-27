import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhCategorieProfessionnelleService } from 'src/app/data/modules/rh/services/rh-categorie-professionnelle.service';
import { CategorieProfessionnelle } from 'src/app/data/modules/rh/models/CategorieProfessionnelle.model';

@Component({
  selector: 'app-liste-categories-professionnelles-page',
  templateUrl: './liste-categories-professionnelles-page.component.html',
  styleUrls: ['./liste-categories-professionnelles-page.component.scss']
})
export class ListeCategoriesProfessionnellesPageComponent extends BaseComponentClass implements OnInit {
  categories: CategorieProfessionnelle[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { code: '', nom: '', description: '', salaireBase: '', avantages: '' };

  constructor(
    private categorieService: RhCategorieProfessionnelleService,
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
    this.formData = { code: '', nom: '', description: '', salaireBase: '', avantages: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerCategorie() {
    if (!this.formData.code || !this.formData.nom) return;
    const item = new CategorieProfessionnelle();
    item.code = this.formData.code;
    item.nom = this.formData.nom;
    item.description = this.formData.description;
    item.salaireBase = this.formData.salaireBase ? Number(this.formData.salaireBase) : undefined;
    item.avantages = this.formData.avantages;
    this.categorieService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getCategories(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette catégorie professionnelle ?')) return;
    this.categorieService.delete(id).subscribe({ next: () => this.getCategories() });
  }

  trackByFn(index: number, item: CategorieProfessionnelle): any { return item.id; }
}
