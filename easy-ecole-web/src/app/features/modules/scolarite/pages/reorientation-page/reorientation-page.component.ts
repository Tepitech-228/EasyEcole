import { Component, OnInit } from '@angular/core';
import { DemandeReorientation } from 'src/app/data/modules/scolarite/models/DemandeReorientation.model';
import { DemandeReorientationService } from 'src/app/data/modules/scolarite/services/demande-reorientation.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-reorientation-page',
  templateUrl: './reorientation-page.component.html',
  styleUrls: ['./reorientation-page.component.scss']
})
export class ReorientationPageComponent extends BaseComponentClass implements OnInit {
  items: DemandeReorientation[] = [];
  _items: DemandeReorientation[] = [];
  loading: boolean = false;
  adding: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchQuery: string = '';

  newItem: any = {
    cursusApprenantId: '', parcoursActuelId: '', parcoursCibleId: '', motif: ''
  };

  currentPage: number = 1;
  pageSize: number = 15;

  constructor(private service: DemandeReorientationService) {
    super();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  get paginatedItems(): DemandeReorientation[] {
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

  createItem(): void {
    if (!this.newItem.cursusApprenantId || !this.newItem.motif) return;
    this.adding = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.service.create(this.newItem).subscribe({
      next: () => {
        this.newItem = { cursusApprenantId: '', parcoursActuelId: '', parcoursCibleId: '', motif: '' };
        this.successMessage = 'Demande soumise avec succès';
        this.adding = false;
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la soumission';
        this.adding = false;
      }
    });
  }

  traiter(s: DemandeReorientation, statut: string): void {
    if (!s.id) return;
    this.service.traiter(s.id, statut, 1).subscribe({
      next: () => {
        this.successMessage = 'Demande traitée avec succès';
        this.loadItems();
      },
      error: () => this.errorMessage = 'Erreur lors du traitement'
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._items = this.items.filter(s => {
      return !this.searchQuery || s.motif.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'soumise': return 'blue';
      case 'etude': return 'orange';
      case 'approuvee': return 'green';
      case 'rejetee': return 'red';
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
