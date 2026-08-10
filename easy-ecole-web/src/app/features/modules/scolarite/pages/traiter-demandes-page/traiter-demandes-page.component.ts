import { Component, OnInit } from '@angular/core';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DossierNode, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-traiter-demandes-page',
  templateUrl: './traiter-demandes-page.component.html',
  styleUrls: ['./traiter-demandes-page.component.scss']
})
export class TraiterDemandesPageComponent extends BaseComponentClass implements OnInit {
  // Data
  demandes: DemandeDocument[] = [];
  loading: boolean = false;
  batchLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Filter data
  annees: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  sessions: Session[] = [];
  dataLoaded: boolean = false;

  // Filter values
  selectedAnneeId: string = '';
  selectedNiveauId: string = '';
  selectedParcoursId: string = '';
  filterStatut: string = '';
  searchQuery: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalItems: number = 0;
  totalPages: number = 1;

  // Batch
  selectedIds: number[] = [];
  showRejetModal: boolean = false;
  motifRejet: string = '';

  // Dossier tree nodes
  treeNodes: DossierNode[] = [];

  // Batch actions
  batchActions: BatchAction[] = [
    { label: 'Valider la sélection', color: 'green', action: 'valider', icon: 'check' },
    { label: 'Rejeter la sélection', color: 'red', action: 'rejeter', icon: 'close' }
  ];

  // Action individuelle sur une ligne
  itemActions: BatchAction[] = [
    { label: 'Confirmer le paiement', color: 'green', action: 'confirmerPaiement', icon: 'payments' }
  ];

  // Columns for item display
  itemColumns = [
    { key: 'typeDocument', label: 'Type document' },
    { key: 'statut', label: 'Statut' },
    { key: 'montant', label: 'Montant' },
    { key: 'source', label: 'Source' },
    { key: 'paiement', label: 'Paiement' },
    { key: 'date', label: 'Date' }
  ];

  // Id de la demande dont le paiement est en cours de confirmation
  paiementLoadingId: string | null = null;

  constructor(
    private demandeService: DemandeDocumentService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
  ) {
    super();
  }

  ngOnInit(): void {
    // Load filter data
    combineLatest([
      this.anneeAcademiqueService.getAll(),
      this.niveauEtudeService.getAll(),
      this.parcoursService.getAll(),
      this.sessionService.getAll()
    ]).subscribe({
      next: ([annees, niveaux, parcours, sessions]) => {
        this.annees = annees;
        this.niveaux = niveaux;
        this.parcoursList = parcours;
        this.sessions = sessions;
        this.dataLoaded = true;
      },
      error: () => {
        this.dataLoaded = true;
      }
    });

    this.loadDemandes();
  }

  onFilterChange(filters: { anneeId: string; niveauId: string; parcoursId: string }): void {
    this.selectedAnneeId = filters.anneeId;
    this.selectedNiveauId = filters.niveauId;
    this.selectedParcoursId = filters.parcoursId;
    this.currentPage = 1;
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.loading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      orderBy: 'date',
      orderDir: 'DESC'
    };
    if (this.filterStatut) params.statut = this.filterStatut;
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId;
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId;
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId;
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();

    this.demandeService.getAll(params).subscribe({
      next: (res: any) => {
        this.demandes = res.data || res;
        this.totalItems = res.pagination?.total || this.demandes.length;
        this.totalPages = res.pagination?.totalPages || 1;
        this.currentPage = res.pagination?.page || 1;
        this.buildTreeNodes();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des demandes';
        this.loading = false;
      }
    });
  }

  private buildTreeNodes(): void {
    // Group by annee -> niveau -> parcours -> etudiant -> items
    const groups: any = {};

    for (const d of this.demandes) {
      const anneeKey = d.anneeAcademiqueId || 'sans-annee';
      const niveauKey = d.niveauEtudeId || 'sans-niveau';
      const parcoursKey = d.parcoursId || 'sans-parcours';
      const etudiantKey = d.etudiantId;
      const etudiantLabel = d.etudiant ? `${d.etudiant.nom || ''} ${d.etudiant.prenoms || ''}`.trim() || `#${d.etudiantId}` : `#${d.etudiantId}`;

      if (!groups[anneeKey]) groups[anneeKey] = {};
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey]) groups[anneeKey][niveauKey][parcoursKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey][etudiantKey]) groups[anneeKey][niveauKey][parcoursKey][etudiantKey] = { label: etudiantLabel, items: [] };

      groups[anneeKey][niveauKey][parcoursKey][etudiantKey].items.push(d);
    }

    // Build tree structure
    this.treeNodes = Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: this.getAnneeLibelle(anneeKey),
      id: anneeKey,
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, parcours]: [string, any]) => ({
        type: 'niveau' as const,
        label: this.getNiveauLibelle(niveauKey),
        id: niveauKey,
        expanded: true,
        children: Object.entries(parcours).map(([parcoursKey, etudiants]: [string, any]) => ({
          type: 'parcours' as const,
          label: this.getParcoursTitre(parcoursKey),
          id: parcoursKey,
          expanded: true,
          children: Object.entries(etudiants).map(([etudiantKey, etudiant]: [string, any]) => ({
            type: 'etudiant' as const,
            label: etudiant.label,
            id: etudiantKey,
            expanded: true,
            items: etudiant.items
          }))
        }))
      }))
    }));
  }

  onSelectionChange(event: { ids: number[] }): void {
    this.selectedIds = event.ids;
  }

  /**
   * Une demande volontaire payante (montant > 0, fraisPayes = false) ne peut
   * pas être validée / délivrée avant confirmation du paiement.
   */
  isPaiementBloquant(demande: DemandeDocument): boolean {
    return Number(demande.montant) > 0 && !demande.fraisPayes;
  }

  onBatchAction(event: { action: string; ids: number[] }): void {
    if (event.action === 'rejeter' && event.ids.length > 0) {
      this.showRejetModal = true;
    } else if (event.action === 'valider' && event.ids.length > 0) {
      this.executeBatch('validee', event.ids);
    }
  }

  confirmerRejetBatch(): void {
    if (this.selectedIds.length > 0) {
      this.executeBatch('rejetee', this.selectedIds);
      this.showRejetModal = false;
      this.motifRejet = '';
    }
  }

  private executeBatch(statut: string, ids: number[]): void {
    // Blocage visuel côté front : une demande payante impayée ne peut pas être validée.
    if (statut === 'validee') {
      const bloquantes = this.demandes.filter(d =>
        d.id && ids.includes(Number(d.id)) && this.isPaiementBloquant(d)
      );
      if (bloquantes.length > 0) {
        this.errorMessage = 'Paiement requis avant délivrance du document : certaines demandes sont payantes et non réglées (confirmez d\'abord le paiement).';
        return;
      }
    }

    this.batchLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeService.batchUpdateStatus(ids, statut).subscribe({
      next: (res) => {
        this.successMessage = `${res.count || ids.length} demande(s) ${statut === 'validee' ? 'validée(s)' : 'rejetée(s)'} avec succès`;
        this.selectedIds = [];
        this.batchLoading = false;
        this.loadDemandes();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du traitement batch';
        this.batchLoading = false;
      }
    });
  }

  onItemAction(event: { item: any; action: string }): void {
    if (event.action === 'confirmerPaiement') {
      this.confirmerPaiement(event.item);
    } else if (event.action === 'valider') {
      if (this.isPaiementBloquant(event.item)) {
        this.errorMessage = 'Paiement requis : cette demande est payante et non réglée. Confirmez d\'abord le paiement.';
        return;
      }
      this.executeBatch('validee', [event.item.id]);
    } else if (event.action === 'rejeter') {
      this.selectedIds = [event.item.id];
      this.showRejetModal = true;
    }
  }

  /** Confirme l'encaissement d'une demande payante (PUT /:id/confirmer-paiement) */
  confirmerPaiement(demande: DemandeDocument): void {
    if (!demande.id) return;
    if (demande.fraisPayes) {
      this.errorMessage = 'Cette demande est déjà réglée.';
      return;
    }
    if (Number(demande.montant) <= 0) {
      this.errorMessage = 'Cette demande est gratuite, aucun paiement à confirmer.';
      return;
    }

    this.paiementLoadingId = demande.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeService.confirmerPaiement(demande.id).subscribe({
      next: () => {
        this.paiementLoadingId = null;
        this.successMessage = 'Paiement confirmé avec succès.';
        this.loadDemandes();
      },
      error: (err) => {
        this.paiementLoadingId = null;
        this.errorMessage = err?.error?.message || 'Erreur lors de la confirmation du paiement';
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDemandes();
  }

  getStatutCount(statut: string): number {
    return 0; // Would need a separate count endpoint or derive from totalItems
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

  // Helper methods for labels
  private getAnneeLibelle(id: string): string {
    if (id === 'sans-annee') return 'Sans année';
    return this.annees.find(a => String(a.id) === String(id))?.libelle || `Année #${id}`;
  }

  private getNiveauLibelle(id: string): string {
    if (id === 'sans-niveau') return 'Sans niveau';
    return this.niveaux.find(n => String(n.id) === String(id))?.libelle || `Niveau #${id}`;
  }

  private getParcoursTitre(id: string): string {
    if (id === 'sans-parcours') return 'Sans parcours';
    return this.parcoursList.find(p => String(p.id) === String(id))?.titre || `Parcours #${id}`;
  }
}
