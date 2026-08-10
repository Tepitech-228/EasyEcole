import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DemandeDocument, VerifierAccesDemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
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

  /** État précis (gratuit/payant/payé) récupéré via GET /:id/verifier-acces */
  accesMap: Record<string, VerifierAccesDemandeDocument> = {};
  /** Id de la demande en cours de paiement (pour désactiver les boutons) */
  payingId: string | null = null;

  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private demandeService: DemandeDocumentService,
    private typeDocumentService: TypeDocumentService,
    private router: Router
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
      next: (data: any) => {
        this.demandes = data.data || data;
        this._demandes = [...this.demandes];
        this.loading = false;
        this.loadAcces();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des demandes';
        this.loading = false;
      }
    });
  }

  /**
   * Récupère l'état précis (gratuit / montant / fraisPayes / source) de chaque demande
   * via GET /:id/verifier-acces. Les appels en échec retombent sur les champs de la demande.
   */
  private loadAcces(): void {
    const demandesAvecId = this.demandes.filter(d => !!d.id);
    if (demandesAvecId.length === 0) {
      this.accesMap = {};
      return;
    }

    const calls = demandesAvecId.map(d =>
      this.demandeService.verifierAcces(d.id!).pipe(
        map(acces => ({ id: d.id!, acces })),
        catchError(() => of({ id: d.id!, acces: null }))
      )
    );

    forkJoin(calls).subscribe(results => {
      const map: Record<string, VerifierAccesDemandeDocument> = {};
      results.forEach(r => {
        if (r.acces) map[r.id] = r.acces;
      });
      this.accesMap = map;
    });
  }

  /** État d'accès d'une demande (endpoint verifier-acces, sinon repli sur les champs locaux) */
  accesFor(demande: DemandeDocument): VerifierAccesDemandeDocument {
    if (demande.id && this.accesMap[demande.id]) {
      return this.accesMap[demande.id];
    }
    const montant = Number(demande.montant) || 0;
    return {
      gratuit: montant <= 0 || demande.source === 'automatique',
      montant,
      fraisPayes: !!demande.fraisPayes,
      source: demande.source || 'demande_etudiant'
    };
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
      next: (demande) => {
        this.newDemande = { typeDocumentId: '' };
        const payant = Number(demande.montant) > 0;
        this.successMessage = payant
          ? `Demande soumise avec succès. Cette demande est payante (${Number(demande.montant).toLocaleString('fr-FR')} FC) — veuillez procéder au paiement.`
          : 'Demande soumise avec succès (gratuite).';
        this.loadDemandes();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la soumission de la demande';
        this.loading = false;
      }
    });
  }

  /**
   * Paiement via bordereau : crée le bordereau de la demande puis redirige
   * vers la page « Mes bordereaux » (encaissement bordereau existant).
   */
  payerBordereau(demande: DemandeDocument) {
    if (!demande.id) return;
    this.payingId = demande.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeService.creerBordereau(demande.id).subscribe({
      next: () => {
        this.payingId = null;
        this.successMessage = 'Bordereau de paiement créé. Téléversez votre justificatif depuis « Mes bordereaux ».';
        this.router.navigate(['/inscription/bordereaux']);
      },
      error: (err) => {
        this.payingId = null;
        this.errorMessage = err?.error?.message || 'Erreur lors de la création du bordereau';
      }
    });
  }

  /** Paiement en ligne simulé : confirmation automatique + écriture comptable */
  payerEnLigne(demande: DemandeDocument) {
    if (!demande.id) return;
    this.payingId = demande.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeService.confirmerPaiementAuto(demande.id).subscribe({
      next: () => {
        this.payingId = null;
        this.successMessage = 'Paiement en ligne confirmé avec succès.';
        this.loadDemandes();
      },
      error: (err) => {
        this.payingId = null;
        this.errorMessage = err?.error?.message || 'Erreur lors du paiement en ligne';
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
