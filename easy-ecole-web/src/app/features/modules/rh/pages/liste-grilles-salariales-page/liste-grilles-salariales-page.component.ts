import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhGrilleSalarialeService } from 'src/app/data/modules/rh/services/rh-grille-salariale.service';
import { RhCategorieProfessionnelleService } from 'src/app/data/modules/rh/services/rh-categorie-professionnelle.service';
import { GrilleSalariale } from 'src/app/data/modules/rh/models/GrilleSalariale.model';
import { CategorieProfessionnelle } from 'src/app/data/modules/rh/models/CategorieProfessionnelle.model';

@Component({
  selector: 'app-liste-grilles-salariales-page',
  templateUrl: './liste-grilles-salariales-page.component.html',
  styleUrls: ['./liste-grilles-salariales-page.component.scss']
})
export class ListeGrillesSalarialesPageComponent extends BaseComponentClass implements OnInit {
  grilles: GrilleSalariale[] = [];
  categories: CategorieProfessionnelle[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { code: '', nom: '', categorieProfessionnelleId: '', echelon: '', salaireMinimum: '', salaireMaximum: '', primeAnciennete: '' };
  filterCategorieId: string = '';

  constructor(
    private grilleService: RhGrilleSalarialeService,
    private categorieService: RhCategorieProfessionnelleService,
    private route: ActivatedRoute,
  ) { super(); }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.filterCategorieId = params['categorieId'] || '';
    });
    this.categorieService.getAll().subscribe(data => this.categories = data);
    this.getGrilles();
  }

  getGrilles(): void {
    this.loading = true;
    this.grilleService.getAll().subscribe({
      next: (res) => { this.grilles = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get filteredGrilles(): GrilleSalariale[] {
    if (!this.filterCategorieId) return this.grilles;
    return this.grilles.filter(g => g.categorieProfessionnelleId === this.filterCategorieId);
  }

  ouvrirFormulaire() {
    this.formData = { code: '', nom: '', categorieProfessionnelleId: this.filterCategorieId, echelon: '', salaireMinimum: '', salaireMaximum: '', primeAnciennete: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerGrille() {
    if (!this.formData.code || !this.formData.nom) return;
    const item = new GrilleSalariale();
    item.code = this.formData.code;
    item.nom = this.formData.nom;
    item.categorieProfessionnelleId = this.formData.categorieProfessionnelleId || undefined;
    item.echelon = this.formData.echelon;
    item.salaireMinimum = this.formData.salaireMinimum ? Number(this.formData.salaireMinimum) : undefined;
    item.salaireMaximum = this.formData.salaireMaximum ? Number(this.formData.salaireMaximum) : undefined;
    item.primeAnciennete = this.formData.primeAnciennete ? Number(this.formData.primeAnciennete) : undefined;
    this.grilleService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getGrilles(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette grille salariale ?')) return;
    this.grilleService.delete(id).subscribe({ next: () => this.getGrilles() });
  }

  getCategorieNom(id?: string): string {
    if (!id) return '-';
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.nom || '-' : '-';
  }

  trackByFn(index: number, item: GrilleSalariale): any { return item.id; }
}
