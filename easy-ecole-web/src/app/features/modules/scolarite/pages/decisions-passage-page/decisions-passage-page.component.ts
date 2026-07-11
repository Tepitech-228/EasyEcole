import { Component, OnInit } from '@angular/core';
import { DecisionPassage } from 'src/app/data/modules/scolarite/models/DecisionPassage.model';
import { DecisionPassageService } from 'src/app/data/modules/scolarite/services/decision-passage.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-decisions-passage-page',
  templateUrl: './decisions-passage-page.component.html',
  styleUrls: ['./decisions-passage-page.component.scss']
})
export class DecisionsPassagePageComponent extends BaseComponentClass implements OnInit {
  items: DecisionPassage[] = [];
  _items: DecisionPassage[] = [];
  loading: boolean = false;
  adding: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  filterAnnee: string = '';

  newItem: any = {
    cursusApprenantId: '', anneeAcademiqueId: '', moyenneGenerale: '',
    creditsAcquis: '', creditsRequis: '', decision: 'admis', dateDecision: '', validePar: ''
  };

  currentPage: number = 1;
  pageSize: number = 15;

  constructor(private service: DecisionPassageService) {
    super();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  get paginatedItems(): DecisionPassage[] {
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
    if (!this.newItem.cursusApprenantId || !this.newItem.decision) return;
    this.adding = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.service.create(this.newItem).subscribe({
      next: () => {
        this.newItem = { cursusApprenantId: '', anneeAcademiqueId: '', moyenneGenerale: '', creditsAcquis: '', creditsRequis: '', decision: 'admis', dateDecision: '', validePar: '' };
        this.successMessage = 'Decision ajoutée avec succès';
        this.adding = false;
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'ajout';
        this.adding = false;
      }
    });
  }

  deleteItem(s: DecisionPassage): void {
    if (!s.id || !confirm('Supprimer cette décision ?')) return;
    this.service.delete(s.id).subscribe({
      next: () => {
        this.successMessage = 'Decision supprimée';
        this.loadItems();
      },
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  filtrerParAnnee(): void {
    this.currentPage = 1;
    if (this.filterAnnee) {
      this._items = this.items.filter(s => s.anneeAcademiqueId.toString() === this.filterAnnee);
    } else {
      this._items = [...this.items];
    }
  }

  getDecisionColor(decision: string): string {
    switch (decision) {
      case 'admis': return 'green';
      case 'rattrapage': return 'orange';
      case 'redoublement': return 'red';
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
