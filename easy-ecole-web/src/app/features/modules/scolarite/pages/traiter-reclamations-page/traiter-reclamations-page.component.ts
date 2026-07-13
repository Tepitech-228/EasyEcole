import { Component, OnInit } from '@angular/core';
import { Reclamation } from 'src/app/data/modules/scolarite/models/Reclamation.model';
import { ReclamationService } from 'src/app/data/modules/scolarite/services/reclamation.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-traiter-reclamations-page',
  templateUrl: './traiter-reclamations-page.component.html',
  styleUrls: ['./traiter-reclamations-page.component.scss']
})
export class TraiterReclamationsPageComponent extends BaseComponentClass implements OnInit {
  reclamations: Reclamation[] = [];
  _reclamations: Reclamation[] = [];
  searchQuery: string = '';
  filterStatut: string = 'undefined';
  loading: boolean = false;
  reponseLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  expandedId: string | null = null;
  reponses: any = {};

  currentPage: number = 1;
  pageSize: number = 10;

  constructor(private reclamationService: ReclamationService) {
    super();
  }

  ngOnInit() {
    this.loadReclamations();
  }

  get paginatedReclamations(): Reclamation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._reclamations.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this._reclamations.length / this.pageSize) || 1;
  }

  loadReclamations() {
    this.loading = true;
    this.errorMessage = '';
    this.reclamationService.getAll().subscribe({
      next: (data) => {
        this.reclamations = data;
        this._reclamations = [...this.reclamations];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des réclamations';
        this.loading = false;
      }
    });
  }

  repondre(rec: Reclamation) {
    const id = rec.id;
    if (!id || !this.reponses[id]?.trim()) return;
    this.reponseLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.reclamationService.repondre(id, this.reponses[id]).subscribe({
      next: () => {
        this.reponses[id] = '';
        this.successMessage = 'Réponse envoyée avec succès';
        this.reponseLoading = false;
        this.loadReclamations();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'envoi de la réponse';
        this.reponseLoading = false;
      }
    });
  }

  fermer(rec: Reclamation) {
    if (!rec.id) return;
    this.reponseLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.reclamationService.updateStatus(rec.id, 'fermee').subscribe({
      next: () => {
        this.successMessage = 'Réclamation fermée';
        this.reponseLoading = false;
        this.loadReclamations();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la fermeture';
        this.reponseLoading = false;
      }
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._reclamations = this.reclamations.filter(r => {
      const matchSearch = !this.searchQuery ||
        r.motif.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.etudiant?.nom?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatut = this.filterStatut === 'undefined' || r.statut === this.filterStatut;
      return matchSearch && matchStatut;
    });
  }

  toggleExpand(id: string | undefined): void {
    this.expandedId = this.expandedId === id ? null : id ?? null;
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'ouverte': return 'Ouverte';
      case 'traitee': return 'Traitée';
      case 'fermee': return 'Fermée';
      default: return statut;
    }
  }

  statutColor(statut: string): string {
    switch (statut) {
      case 'ouverte': return 'yellow';
      case 'traitee': return 'green';
      case 'fermee': return 'gray';
      default: return 'gray';
    }
  }

  getStatutCount(statut: string): number {
    return this.reclamations.filter(r => r.statut === statut).length;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
}
