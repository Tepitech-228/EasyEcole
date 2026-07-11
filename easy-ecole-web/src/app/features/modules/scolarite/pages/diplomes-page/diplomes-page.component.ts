import { Component, OnInit } from '@angular/core';
import { Diplome } from 'src/app/data/modules/scolarite/models/Diplome.model';
import { DiplomeService } from 'src/app/data/modules/scolarite/services/diplome.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-diplomes-page',
  templateUrl: './diplomes-page.component.html',
  styleUrls: ['./diplomes-page.component.scss']
})
export class DiplomesPageComponent extends BaseComponentClass implements OnInit {
  items: Diplome[] = [];
  _items: Diplome[] = [];
  loading: boolean = false;
  adding: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchQuery: string = '';
  generatedNumero: string = '';

  newItem: any = {
    cursusApprenantId: '', parcoursId: '', niveauEtudeId: '', anneeObtention: '',
    mention: 'passable', numeroDiplome: '', dateDelivrance: '', fichierPDF: ''
  };

  currentPage: number = 1;
  pageSize: number = 15;

  constructor(private service: DiplomeService) {
    super();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  get paginatedItems(): Diplome[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._items.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this._items.length / this.pageSize) || 1;
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll().subscribe({
      next: (data) => {
        this.items = data;
        this._items = [...this.items];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  genererNumero(): void {
    const annee = this.newItem.anneeObtention || new Date().getFullYear().toString();
    this.service.genererNumero(annee).subscribe({
      next: (res) => {
        this.newItem.numeroDiplome = res.numero;
        this.generatedNumero = res.numero;
      },
      error: () => this.errorMessage = 'Erreur lors de la génération du numéro'
    });
  }

  createItem(): void {
    if (!this.newItem.cursusApprenantId || !this.newItem.numeroDiplome) return;
    this.adding = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.service.create(this.newItem).subscribe({
      next: () => {
        this.newItem = { cursusApprenantId: '', parcoursId: '', niveauEtudeId: '', anneeObtention: '', mention: 'passable', numeroDiplome: '', dateDelivrance: '', fichierPDF: '' };
        this.generatedNumero = '';
        this.successMessage = 'Diplôme ajouté avec succès';
        this.adding = false;
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'ajout';
        this.adding = false;
      }
    });
  }

  deleteItem(s: Diplome): void {
    if (!s.id || !confirm('Supprimer ce diplôme ?')) return;
    this.service.delete(s.id).subscribe({
      next: () => {
        this.successMessage = 'Diplôme supprimé';
        this.loadItems();
      },
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._items = this.items.filter(s => {
      return !this.searchQuery ||
        s.numeroDiplome.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }

  getMentionColor(mention: string): string {
    switch (mention) {
      case 'tres_bien': return 'green';
      case 'bien': return 'blue';
      case 'assez_bien': return 'orange';
      case 'passable': return 'gray';
      default: return 'gray';
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
}
