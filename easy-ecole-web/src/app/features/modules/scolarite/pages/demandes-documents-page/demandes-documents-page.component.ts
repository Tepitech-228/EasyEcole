import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DemandeDocument, VerifierAccesDemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { TypeDocument } from 'src/app/data/modules/scolarite/models/TypeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { TypeDocumentService } from 'src/app/data/modules/scolarite/services/type-document.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';

@Component({
  selector: 'app-demandes-documents-page',
  templateUrl: './demandes-documents-page.component.html',
  styleUrls: ['./demandes-documents-page.component.scss']
})
export class DemandesDocumentsPageComponent extends BaseComponentClass implements OnInit {
  demandes: DemandeDocument[] = [];
  _demandes: DemandeDocument[] = [];
  typesDocument: TypeDocument[] = [];
  newDemande: any = { typeDocumentId: null, recuCaisseId: null, anneeAcademiqueId: null, semestre: '' };
  anneesAcademiques: any[] = [];
  recusDisponibles: any[] = [];
  loadingRecus = false;
  searchQuery: string = '';
  filterStatut: string = 'undefined';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showDeleteModal: boolean = false;
  demandeToDelete: DemandeDocument | null = null;

  /** État précis (gratuit/payant/payé) récupéré via GET /:id/verifier-acces */
  accesMap: Record<string, VerifierAccesDemandeDocument> = {};

  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private demandeService: DemandeDocumentService,
    private typeDocumentService: TypeDocumentService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private router: Router
  ) {
    super();
  }

  ngOnInit() {
    this.loadDemandes();
    this.loadTypesDocument();
    this.anneeAcademiqueService.getAll().subscribe({
      next: annees => this.anneesAcademiques = annees,
      error: () => this.errorMessage = "Impossible de charger les années académiques."
    });
  }

  get selectedTypeFrais(): number | null {
    if (!this.newDemande.typeDocumentId) return null;
    const type = this.typesDocument.find(t => Number(t.id) === Number(this.newDemande.typeDocumentId));
    return type ? Number(type.frais) : null;
  }

  get typeSelectionne(): TypeDocument | undefined {
    return this.typesDocument.find(t => Number(t.id) === Number(this.newDemande.typeDocumentId));
  }

  get estReleveNotes(): boolean {
    const libelle = (this.typeSelectionne?.libelle || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return libelle.includes('releve') && libelle.includes('note');
  }

  get peutCommencerDemande(): boolean {
    if (!this.newDemande.typeDocumentId || this.loading || this.loadingRecus) return false;
    if ((this.selectedTypeFrais || 0) > 0 && !this.newDemande.recuCaisseId) return false;
    return !this.estReleveNotes || (!!this.newDemande.anneeAcademiqueId && !!this.newDemande.semestre);
  }

  libelleSemestre(semestre: string): string {
    return `Semestre ${semestre.replace('semestre', '')}`;
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

  onTypeDocumentChange(): void {
    this.newDemande.recuCaisseId = null;
    this.recusDisponibles = [];
    if ((this.selectedTypeFrais || 0) <= 0 || !this.newDemande.typeDocumentId) return;
    this.loadingRecus = true;
    this.demandeService.getMesPaiementsDisponibles(Number(this.newDemande.typeDocumentId)).subscribe({
      next: recus => {
        this.recusDisponibles = recus;
        this.loadingRecus = false;
      },
      error: err => {
        this.loadingRecus = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger les reçus de paiement.';
      }
    });
  }

  submitDemande() {
    if (!this.peutCommencerDemande) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const payload = {
      typeDocumentId: String(this.newDemande.typeDocumentId),
      recuCaisseId: this.newDemande.recuCaisseId ? Number(this.newDemande.recuCaisseId) : undefined,
      anneeAcademiqueId: this.estReleveNotes ? Number(this.newDemande.anneeAcademiqueId) : undefined,
      semestre: this.estReleveNotes ? this.newDemande.semestre : undefined
    };
    this.demandeService.create(payload).subscribe({
      next: (demande) => {
        this.newDemande = { typeDocumentId: null, recuCaisseId: null, anneeAcademiqueId: null, semestre: '' };
        this.recusDisponibles = [];
        this.loading = false;
        if (!demande.id) {
          this.errorMessage = 'Le brouillon a été créé sans identifiant récupérable.';
          return;
        }
        this.router.navigate(['/scolarite/demandes-documents', demande.id]);
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la création de la demande';
        this.loading = false;
      }
    });
  }

  reprendreDemande(demande: DemandeDocument): void {
    if (!demande.id) return;
    this.router.navigate(['/scolarite/demandes-documents', demande.id]);
  }

  peutAnnulerDemande(demande: DemandeDocument): boolean {
    return !this.accesFor(demande).fraisPayes
      && !demande.recuCaisseId
      && ['brouillon', 'soumise', 'en_attente_paiement', 'rejetee'].includes(demande.statut);
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
      case 'brouillon': return 'Brouillon';
      case 'soumise': return 'Soumise';
      case 'en_comite': return 'En validation du comité';
      case 'validee': return 'Validée';
      case 'rejetee': return 'Rejetée';
      case 'delivree': return 'Délivrée';
      default: return statut;
    }
  }

  statutColor(statut: string): string {
    switch (statut) {
      case 'brouillon': return 'orange';
      case 'soumise': return 'yellow';
      case 'en_comite': return 'purple';
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
