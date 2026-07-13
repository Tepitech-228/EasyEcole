import { Component, OnInit } from '@angular/core';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { TypeDocument } from 'src/app/data/modules/scolarite/models/TypeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { TypeDocumentService } from 'src/app/data/modules/scolarite/services/type-document.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-demandes-documents-page',
  templateUrl: './demandes-documents-page.component.html',
  styleUrls: ['./demandes-documents-page.component.scss']
})
export class DemandesDocumentsPageComponent extends BaseComponentClass implements OnInit {
  demandes: DemandeDocument[] = [];
  _demandes: DemandeDocument[] = [];
  typesDocument: TypeDocument[] = [];
  newDemande: any = { typeDocumentId: '' };
  searchQuery: string = '';
  filterStatut: string = 'undefined';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showDeleteModal: boolean = false;
  demandeToDelete: DemandeDocument | null = null;

  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private demandeService: DemandeDocumentService,
    private typeDocumentService: TypeDocumentService
  ) {
    super();
  }

  ngOnInit() {
    this.loadDemandes();
    this.loadTypesDocument();
  }

  get selectedTypeFrais(): number | null {
    if (!this.newDemande.typeDocumentId) return null;
    const type = this.typesDocument.find(t => t.id === this.newDemande.typeDocumentId);
    return type ? type.frais : null;
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

  loadTypesDocument() {
    this.typeDocumentService.getAll().subscribe(data => {
      this.typesDocument = data;
    });
  }

  submitDemande() {
    if (!this.newDemande.typeDocumentId) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeService.create(this.newDemande).subscribe({
      next: () => {
        this.newDemande = { typeDocumentId: '' };
        this.successMessage = 'Demande soumise avec succès';
        this.loadDemandes();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la soumission de la demande';
        this.loading = false;
      }
    });
  }

  confirmDelete(demande: DemandeDocument) {
    this.demandeToDelete = demande;
    this.showDeleteModal = true;
  }

  deleteDemande() {
    if (!this.demandeToDelete?.id) return;
    this.demandeService.delete(this.demandeToDelete.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.demandeToDelete = null;
        this.successMessage = 'Demande annulée avec succès';
        this.loadDemandes();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'annulation';
        this.showDeleteModal = false;
      }
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._demandes = this.demandes.filter(d => {
      const matchSearch = !this.searchQuery ||
        d.typeDocument?.libelle?.toLowerCase().includes(this.searchQuery.toLowerCase());
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
