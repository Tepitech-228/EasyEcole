import { Component, OnInit } from '@angular/core';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-traiter-demandes-page',
  templateUrl: './traiter-demandes-page.component.html',
  styleUrls: ['./traiter-demandes-page.component.scss']
})
export class TraiterDemandesPageComponent extends BaseComponentClass implements OnInit {
  demandes: DemandeDocument[] = [];
  _demandes: DemandeDocument[] = [];
  searchQuery: string = '';
  filterStatut: string = 'undefined';
  loading: boolean = false;
  traiterLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showRejetModal: boolean = false;
  demandeToRejeter: DemandeDocument | null = null;
  motifRejet: string = '';

  currentPage: number = 1;
  pageSize: number = 10;

  constructor(private demandeService: DemandeDocumentService) {
    super();
  }

  ngOnInit() {
    this.loadDemandes();
  }

  get paginatedDemandes(): DemandeDocument[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._demandes.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this._demandes.length / this.pageSize) || 1;
  }

  loadDemandes() {
    this.loading = true;
    this.errorMessage = '';
    this.demandeService.getAll().subscribe({
      next: (data) => {
        this.demandes = data;
        this._demandes = [...this.demandes];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des demandes';
        this.loading = false;
      }
    });
  }

  traiter(demande: DemandeDocument, statut: string) {
    if (!demande.id) return;
    this.traiterLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeService.updateStatus(demande.id, statut).subscribe({
      next: () => {
        this.successMessage = `Demande ${statut === 'validee' ? 'validée' : 'marquée comme délivrée'} avec succès`;
        this.traiterLoading = false;
        this.loadDemandes();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du traitement';
        this.traiterLoading = false;
      }
    });
  }

  confirmRejet(demande: DemandeDocument) {
    this.demandeToRejeter = demande;
    this.motifRejet = '';
    this.showRejetModal = true;
  }

  rejeter() {
    if (!this.demandeToRejeter?.id) return;
    this.traiterLoading = true;
    this.demandeService.updateStatus(this.demandeToRejeter.id, 'rejetee').subscribe({
      next: () => {
        this.showRejetModal = false;
        this.demandeToRejeter = null;
        this.motifRejet = '';
        this.successMessage = 'Demande rejetée';
        this.traiterLoading = false;
        this.loadDemandes();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du rejet';
        this.traiterLoading = false;
      }
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._demandes = this.demandes.filter(d => {
      const matchSearch = !this.searchQuery ||
        d.etudiant?.nom?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        `${d.etudiantId}`.includes(this.searchQuery);
      const matchStatut = this.filterStatut === 'undefined' || d.statut === this.filterStatut;
      return matchSearch && matchStatut;
    });
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'soumise': return 'Soumise';
      case 'validee': return 'Validée';
      case 'rejetee': return 'Rejetée';
      case 'delivree': return 'Délivrée';
      default: return statut;
    }
  }

  statutColor(statut: string): string {
    switch (statut) {
      case 'soumise': return 'yellow';
      case 'validee': return 'blue';
      case 'rejetee': return 'red';
      case 'delivree': return 'green';
      default: return 'gray';
    }
  }

  getStatutCount(statut: string): number {
    return this.demandes.filter(d => d.statut === statut).length;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
}
