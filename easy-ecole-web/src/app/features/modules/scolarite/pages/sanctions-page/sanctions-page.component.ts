import { Component, OnInit } from '@angular/core';
import { SanctionAcademique } from 'src/app/data/modules/scolarite/models/SanctionAcademique.model';
import { SanctionAcademiqueService } from 'src/app/data/modules/scolarite/services/sanction-academique.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-sanctions-page',
  templateUrl: './sanctions-page.component.html',
  styleUrls: ['./sanctions-page.component.scss']
})
export class SanctionsPageComponent extends BaseComponentClass implements OnInit {
  items: SanctionAcademique[] = [];
  _items: SanctionAcademique[] = [];
  actives: SanctionAcademique[] = [];
  loading: boolean = false;
  adding: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchQuery: string = '';
  filterType: string = 'undefined';

  newItem: any = {
    cursusApprenantId: '', type: 'avertissement', dateDebut: '', dateFin: '', motif: '', decidePar: ''
  };

  currentPage: number = 1;
  pageSize: number = 15;

  constructor(private service: SanctionAcademiqueService) {
    super();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  get paginatedItems(): SanctionAcademique[] {
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
    this.service.getActives().subscribe({
      next: (data) => { this.actives = data; }
    });
  }

  createItem(): void {
    if (!this.newItem.cursusApprenantId || !this.newItem.type) return;
    this.adding = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.service.create(this.newItem).subscribe({
      next: () => {
        this.newItem = { cursusApprenantId: '', type: 'avertissement', dateDebut: '', dateFin: '', motif: '', decidePar: '' };
        this.successMessage = 'Sanction ajoutée avec succès';
        this.adding = false;
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'ajout';
        this.adding = false;
      }
    });
  }

  deleteItem(s: SanctionAcademique): void {
    if (!s.id || !confirm('Supprimer cette sanction ?')) return;
    this.service.delete(s.id).subscribe({
      next: () => {
        this.successMessage = 'Sanction supprimée';
        this.loadItems();
      },
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._items = this.items.filter(s => {
      const matchSearch = !this.searchQuery || s.motif.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchType = this.filterType === 'undefined' || s.type === this.filterType;
      return matchSearch && matchType;
    });
  }

  isActive(s: SanctionAcademique): boolean {
    return this.actives.some(a => a.id === s.id);
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'avertissement': return 'orange';
      case 'suspension': return 'red';
      case 'exclusion': return 'gray';
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
