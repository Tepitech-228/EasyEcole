import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandePrixService } from 'src/app/data/modules/stocks/services/demande-prix.service';
import { ArticleService } from 'src/app/data/modules/stocks/services/article.service';
import { FournisseurService } from 'src/app/data/modules/stocks/services/fournisseur.service';
import { DemandePrix } from 'src/app/data/modules/stocks/models/DemandePrix.model';
import { Article } from 'src/app/data/modules/stocks/models/Article.model';
import { Fournisseur } from 'src/app/data/modules/stocks/models/Fournisseur.model';

@Component({
  selector: 'app-liste-demandes-prix-page',
  templateUrl: './liste-demandes-prix-page.component.html',
  styleUrls: ['./liste-demandes-prix-page.component.scss']
})
export class ListeDemandesPrixPageComponent extends BaseComponentClass implements OnInit {
  demandes: DemandePrix[] = [];
  articles: Article[] = [];
  fournisseurs: Fournisseur[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { articleId: '', fournisseurId: '', quantite: 1, prixPropose: 0, dateValidite: '' };

  constructor(
    private demandePrixService: DemandePrixService,
    private articleService: ArticleService,
    private fournisseurService: FournisseurService,
  ) { super(); }

  ngOnInit(): void {
    this.articleService.getAll().subscribe(data => this.articles = data);
    this.fournisseurService.getAll().subscribe(data => this.fournisseurs = data);
    this.getDemandes();
  }

  getDemandes(): void {
    this.loading = true;
    this.demandePrixService.getAll().subscribe({
      next: (res) => { this.demandes = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  ouvrirFormulaire() {
    this.formData = { articleId: '', fournisseurId: '', quantite: 1, prixPropose: 0, dateValidite: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerDemande() {
    if (!this.formData.articleId || !this.formData.fournisseurId || !this.formData.quantite) return;
    const item = new DemandePrix();
    item.articleId = this.formData.articleId;
    item.fournisseurId = this.formData.fournisseurId;
    item.quantite = this.formData.quantite;
    item.prixPropose = this.formData.prixPropose || undefined;
    item.dateValidite = this.formData.dateValidite || undefined;
    this.demandePrixService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getDemandes(); },
      error: (err) => console.error(err)
    });
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'ACCEPTEE': return 'bg-green-100 text-green-800';
      case 'REFUSEE': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'ACCEPTEE': return 'Acceptée';
      case 'REFUSEE': return 'Refusée';
      default: return 'En attente';
    }
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette demande de prix ?')) return;
    this.demandePrixService.delete(id).subscribe({ next: () => this.getDemandes() });
  }

  trackByFn(index: number, item: DemandePrix): any { return item.id; }
}
