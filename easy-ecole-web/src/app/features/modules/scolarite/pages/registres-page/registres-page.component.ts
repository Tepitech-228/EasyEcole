import { Component, OnInit } from '@angular/core';
import { RegistreAcademique } from 'src/app/data/modules/scolarite/models/RegistreAcademique.model';
import { RegistreAcademiqueService } from 'src/app/data/modules/scolarite/services/registre-academique.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-registres-page',
  templateUrl: './registres-page.component.html',
  styleUrls: ['./registres-page.component.scss']
})
export class RegistresPageComponent extends BaseComponentClass implements OnInit {
  registres: RegistreAcademique[] = [];
  _registres: RegistreAcademique[] = [];
  searchQuery: string = '';
  filterClasse: string = 'undefined';
  filterDecision: string = 'undefined';
  classes: string[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  currentPage: number = 1;
  pageSize: number = 15;

  constructor(private registreService: RegistreAcademiqueService) {
    super();
  }

  ngOnInit(): void {
    this.loadRegistres();
  }

  get paginatedRegistres(): RegistreAcademique[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._registres.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this._registres.length / this.pageSize) || 1;
  }

  loadRegistres(): void {
    this.loading = true;
    this.errorMessage = '';
    this.registreService.getAll().subscribe({
      next: (data) => {
        this.registres = data;
        this._registres = [...this.registres];
        this.classes = [...new Set(data.map(r => r.classe))];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des registres';
        this.loading = false;
      }
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._registres = this.registres.filter(r => {
      const matchSearch = !this.searchQuery ||
        r.etudiant.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.matricule.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchClasse = this.filterClasse === 'undefined' || r.classe === this.filterClasse;
      const matchDecision = this.filterDecision === 'undefined' || r.decision === this.filterDecision;
      return matchSearch && matchClasse && matchDecision;
    });
  }

  reinitialiserFiltres(): void {
    this.searchQuery = '';
    this.filterClasse = 'undefined';
    this.filterDecision = 'undefined';
    this.currentPage = 1;
    this._registres = [...this.registres];
  }

  getDecisionCount(decision: string): number {
    return this.registres.filter(r => r.decision === decision).length;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
}
