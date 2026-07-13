import { Component, OnInit } from '@angular/core';
import { Reclamation } from 'src/app/data/modules/scolarite/models/Reclamation.model';
import { ReclamationService } from 'src/app/data/modules/scolarite/services/reclamation.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-mes-reclamations-page',
  templateUrl: './mes-reclamations-page.component.html',
  styleUrls: ['./mes-reclamations-page.component.scss']
})
export class MesReclamationsPageComponent extends BaseComponentClass implements OnInit {
  reclamations: Reclamation[] = [];
  _reclamations: Reclamation[] = [];
  newReclamation: any = { motif: '' };
  filterStatut: string = 'undefined';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  expandedId: string | null = null;

  constructor(private reclamationService: ReclamationService) {
    super();
  }

  ngOnInit() {
    this.loadReclamations();
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

  submitReclamation() {
    if (!this.newReclamation.motif.trim()) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.reclamationService.create(this.newReclamation).subscribe({
      next: () => {
        this.newReclamation = { motif: '' };
        this.successMessage = 'Réclamation envoyée avec succès';
        this.loadReclamations();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'envoi de la réclamation';
        this.loading = false;
      }
    });
  }

  filtrer(): void {
    this._reclamations = this.filterStatut === 'undefined'
      ? [...this.reclamations]
      : this.reclamations.filter(r => r.statut === this.filterStatut);
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
}
