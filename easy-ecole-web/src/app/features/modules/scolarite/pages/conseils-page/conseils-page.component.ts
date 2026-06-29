import { Component, OnInit } from '@angular/core';
import { ConseilClasse } from 'src/app/data/modules/scolarite/models/ConseilClasse.model';
import { ConseilClasseService } from 'src/app/data/modules/scolarite/services/conseil-classe.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-conseils-page',
  templateUrl: './conseils-page.component.html',
  styleUrls: ['./conseils-page.component.scss']
})
export class ConseilsPageComponent extends BaseComponentClass implements OnInit {
  conseils: ConseilClasse[] = [];
  _conseils: ConseilClasse[] = [];
  filterStatut: string = 'undefined';
  filterTrimestre: string = 'undefined';
  expandedId: string | null = null;
  loading: boolean = false;
  addingConseil: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  newConseil: any = {
    classe: '', date: '', trimestre: 1, president: '', statut: 'Planifié'
  };

  constructor(private conseilService: ConseilClasseService) {
    super();
  }

  ngOnInit(): void {
    this.loadConseils();
  }

  loadConseils(): void {
    this.loading = true;
    this.errorMessage = '';
    this.conseilService.getAll().subscribe({
      next: (data) => {
        this.conseils = data;
        this._conseils = [...this.conseils];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des conseils';
        this.loading = false;
      }
    });
  }

  createConseil(): void {
    if (!this.newConseil.classe || !this.newConseil.date) return;
    this.addingConseil = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.conseilService.create(this.newConseil).subscribe({
      next: () => {
        this.newConseil = { classe: '', date: '', trimestre: 1, president: '', statut: 'Planifié' };
        this.successMessage = 'Conseil ajouté avec succès';
        this.addingConseil = false;
        this.loadConseils();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'ajout';
        this.addingConseil = false;
      }
    });
  }

  deleteConseil(c: ConseilClasse): void {
    if (!c.id || !confirm('Supprimer ce conseil de classe ?')) return;
    this.conseilService.delete(c.id).subscribe({
      next: () => {
        this.successMessage = 'Conseil supprimé';
        this.loadConseils();
      },
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  filtrer(): void {
    this._conseils = this.conseils.filter(c => {
      const matchStatut = this.filterStatut === 'undefined' || c.statut === this.filterStatut;
      const matchTrimestre = this.filterTrimestre === 'undefined' || c.trimestre === Number(this.filterTrimestre);
      return matchStatut && matchTrimestre;
    });
  }

  reinitialiserFiltres(): void {
    this.filterStatut = 'undefined';
    this.filterTrimestre = 'undefined';
    this._conseils = [...this.conseils];
  }

  toggleExpand(id: string | undefined): void {
    this.expandedId = this.expandedId === id ? null : id ?? null;
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'Terminé': return 'green';
      case 'Planifié': return 'blue';
      case 'À venir': return 'orange';
      default: return 'gray';
    }
  }

  getStatutCount(statut: string): number {
    return this.conseils.filter(c => c.statut === statut).length;
  }
}
