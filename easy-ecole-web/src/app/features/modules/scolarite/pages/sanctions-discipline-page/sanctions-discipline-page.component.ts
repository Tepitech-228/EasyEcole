import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SanctionDiscipline } from 'src/app/data/modules/scolarite/models/SanctionDiscipline.model';
import { SanctionDisciplineService } from 'src/app/data/modules/scolarite/services/sanction-discipline.service';
import { SanctionAcademique } from 'src/app/data/modules/scolarite/models/SanctionAcademique.model';
import { SanctionAcademiqueService } from 'src/app/data/modules/scolarite/services/sanction-academique.service';

@Component({
  selector: 'app-sanctions-discipline-page',
  templateUrl: './sanctions-discipline-page.component.html',
  styleUrls: ['./sanctions-discipline-page.component.scss']
})
export class SanctionsDisciplinePageComponent extends BaseComponentClass implements OnInit {
  activeTab: 'discipline' | 'sanctions' = 'discipline';

  // ── Discipline ──
  sanctions: SanctionDiscipline[] = [];
  _sanctions: SanctionDiscipline[] = [];
  searchQuery: string = '';
  filterStatut: string = 'undefined';
  filterSanction: string = 'undefined';
  loading: boolean = false;
  addingSanction: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  newSanction: any = {
    etudiant: '', matricule: '', classe: '', date: '', motif: '', sanction: '', statut: 'En cours'
  };
  currentPage: number = 1;
  pageSize: number = 15;

  // ── Sanctions académiques ──
  items: SanctionAcademique[] = [];
  _items: SanctionAcademique[] = [];
  actives: SanctionAcademique[] = [];
  adding: boolean = false;
  searchQuery2: string = '';
  filterType: string = 'undefined';
  newItem: any = {
    cursusApprenantId: '', type: 'avertissement', dateDebut: '', dateFin: '', motif: '', decidePar: ''
  };
  currentPage2: number = 1;
  pageSize2: number = 15;

  constructor(
    private disciplineService: SanctionDisciplineService,
    private service: SanctionAcademiqueService
  ) { super(); }

  ngOnInit(): void {
    this.loadSanctions();
    this.loadItems();
  }

  setTab(tab: 'discipline' | 'sanctions'): void {
    this.activeTab = tab;
  }

  // ── Discipline methods ──

  get sanctionTypes(): string[] {
    return [...new Set(this.sanctions.map(s => s.sanction))];
  }

  get paginatedSanctions(): SanctionDiscipline[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._sanctions.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this._sanctions.length / this.pageSize) || 1;
  }

  loadSanctions(): void {
    this.loading = true;
    this.errorMessage = '';
    this.disciplineService.getAll().subscribe({
      next: (data) => {
        this.sanctions = data;
        this._sanctions = [...this.sanctions];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des sanctions';
        this.loading = false;
      }
    });
  }

  createSanction(): void {
    if (!this.newSanction.etudiant || !this.newSanction.sanction) return;
    this.addingSanction = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.disciplineService.create(this.newSanction).subscribe({
      next: () => {
        this.newSanction = { etudiant: '', matricule: '', classe: '', date: '', motif: '', sanction: '', statut: 'En cours' };
        this.successMessage = 'Sanction ajoutée avec succès';
        this.addingSanction = false;
        this.loadSanctions();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'ajout';
        this.addingSanction = false;
      }
    });
  }

  deleteSanction(s: SanctionDiscipline): void {
    if (!s.id || !confirm('Supprimer cette sanction ?')) return;
    this.disciplineService.delete(s.id).subscribe({
      next: () => {
        this.successMessage = 'Sanction supprimée';
        this.loadSanctions();
      },
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._sanctions = this.sanctions.filter(s => {
      const matchSearch = !this.searchQuery ||
        s.etudiant.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.matricule.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatut = this.filterStatut === 'undefined' || s.statut === this.filterStatut;
      const matchSanction = this.filterSanction === 'undefined' || s.sanction === this.filterSanction;
      return matchSearch && matchStatut && matchSanction;
    });
  }

  reinitialiserFiltres(): void {
    this.searchQuery = '';
    this.filterStatut = 'undefined';
    this.filterSanction = 'undefined';
    this.currentPage = 1;
    this._sanctions = [...this.sanctions];
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'Exécutée': return 'green';
      case 'En cours': return 'orange';
      default: return 'gray';
    }
  }

  getStatutCount(statut: string): number {
    return this.sanctions.filter(s => s.statut === statut).length;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  // ── Sanctions académiques methods ──

  get paginatedItems(): SanctionAcademique[] {
    const start = (this.currentPage2 - 1) * this.pageSize2;
    return this._items.slice(start, start + this.pageSize2);
  }

  get totalPages2(): number {
    return Math.ceil(this._items.length / this.pageSize2) || 1;
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

  filtrer2(): void {
    this.currentPage2 = 1;
    this._items = this.items.filter(s => {
      const matchSearch = !this.searchQuery2 || s.motif.toLowerCase().includes(this.searchQuery2.toLowerCase());
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

  nextPage2(): void {
    if (this.currentPage2 < this.totalPages2) this.currentPage2++;
  }

  prevPage2(): void {
    if (this.currentPage2 > 1) this.currentPage2--;
  }
}
