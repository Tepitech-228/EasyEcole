import { Component, OnInit } from '@angular/core';
import { SanctionDiscipline } from 'src/app/data/modules/scolarite/models/SanctionDiscipline.model';
import { SanctionDisciplineService } from 'src/app/data/modules/scolarite/services/sanction-discipline.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-discipline-page',
  templateUrl: './discipline-page.component.html',
  styleUrls: ['./discipline-page.component.scss']
})
export class DisciplinePageComponent extends BaseComponentClass implements OnInit {
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

  constructor(private disciplineService: SanctionDisciplineService) {
    super();
  }

  ngOnInit(): void {
    this.loadSanctions();
  }

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
}
