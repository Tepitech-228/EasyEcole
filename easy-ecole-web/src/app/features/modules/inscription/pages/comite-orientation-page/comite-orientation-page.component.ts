import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
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
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-comite-orientation-page',
  templateUrl: './comite-orientation-page.component.html',
  styleUrls: ['./comite-orientation-page.component.scss']
})
export class ComiteOrientationPageComponent extends BaseComponentClass implements OnInit {
  demandes: DemandeInscription[] = [];

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
  filterStatut: string = 'en_attente';
  searchQuery: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalItems: number = 0;
  totalPages: number = 1;
  loading: boolean = false;
  errorMessage: string = '';

  // Batch
  selectedIds: number[] = [];
  batchLoading: boolean = false;

  // Modals
  showReponseModal: boolean = false;
  selectedDemande?: DemandeInscription;
  commentaireReponse?: string;
  actionEnCours: 'valider' | 'rejeter' = 'valider';

  readonly DOCUMENTS_URL: string = environment.MEDIAS_PATH.INSCRIPTION.DOSSIERS

  // Documents modal
  showDocumentsModal: boolean = false;
  selectedDemandeDocs: any[] = [];
  selectedDemandeTitle: string = '';

  // Dossier tree
  treeNodes: DossierNode[] = [];
  itemColumns = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'dateDemande', label: 'Date' },
    { key: 'documents', label: 'Documents' },
    { key: 'statut', label: 'Statut' }
  ];
  batchActions: BatchAction[] = [
    { label: 'Voir documents', color: 'blue', action: 'voirDocuments', icon: 'description' },
    { label: 'Valider', color: 'green', action: 'valider' },
    { label: 'Rejeter', color: 'red', action: 'rejeter' }
  ];

  constructor(
    private router: Router,
    private demandeInscriptionService: DemandeInscriptionService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService
  ) {
    super();
  }

  ngOnInit(): void {
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
      error: () => { this.dataLoaded = true; }
    });
    this.getDemandes();
  }

  onFilterChange(filters: { anneeId: string; niveauId: string; parcoursId: string }): void {
    this.selectedAnneeId = filters.anneeId;
    this.selectedNiveauId = filters.niveauId;
    this.selectedParcoursId = filters.parcoursId;
    this.currentPage = 1;
    this.getDemandes();
  }

  getDemandes(): void {
    this.loading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.filterStatut) params.statut = this.filterStatut;
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId;
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId;
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId;

    this.demandeInscriptionService.getAll(params).subscribe({
      next: (res: any) => {
        this.demandes = res.data || res;
        this.totalItems = res.pagination?.total || this.demandes.length;
        this.totalPages = res.pagination?.totalPages || 1;
        this.buildTreeNodes();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement demandes:', err);
        this.errorMessage = "Erreur lors du chargement des demandes";
        this.loading = false;
      }
    });
  }

  private buildTreeNodes(): void {
    const groups: { [key: string]: any } = {};
    for (const d of this.demandes) {
      const anneeKey: string = d.session?.anneeAcademiqueId || 'sans-annee';
      const niveauKey: string = d.session?.niveauEtudeId || 'sans-niveau';
      const parcoursKey: string = d.parcoursChoisis?.find((p: any) => p.choixFinal)?.parcoursId || d.parcoursChoisis?.[0]?.parcoursId || 'sans-parcours';
      const etudiantKey: string = d.utilisateurId || 'sans-etudiant';
      const etudiantLabel = d.utilisateur ? `${d.utilisateur.nom || ''} ${d.utilisateur.prenoms || ''}`.trim() || `#${d.utilisateurId}` : `#${d.utilisateurId}`;

      if (!groups[anneeKey]) groups[anneeKey] = {};
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey]) groups[anneeKey][niveauKey][parcoursKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey][etudiantKey]) groups[anneeKey][niveauKey][parcoursKey][etudiantKey] = { label: etudiantLabel, items: [] };

      const docs = (d as any).dossiersDemande || []
      const statut = d.preInscription?.statut || 'en_attente'
      groups[anneeKey][niveauKey][parcoursKey][etudiantKey].items.push({
        ...d,
        documents: docs.length > 0 ? `${docs.length} fichier(s)` : 'Aucun',
        _documents: docs,
        statut
      });
    }

    this.treeNodes = Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: this.getAnneeLibelle(anneeKey),
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, parcours]: [string, any]) => ({
        type: 'niveau' as const,
        label: this.getNiveauLibelle(niveauKey),
        expanded: true,
        children: Object.entries(parcours).map(([parcoursKey, etudiants]: [string, any]) => ({
          type: 'parcours' as const,
          label: this.getParcoursTitre(parcoursKey),
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

  onBatchAction(event: { action: string; ids: number[] }): void {
    if (event.ids.length === 0) return;
    if (event.action === 'rejeter') {
      this.selectedDemande = undefined;
      this.actionEnCours = 'rejeter';
      this.commentaireReponse = undefined;
      this.showReponseModal = true;
    } else if (event.action === 'valider') {
      this.executeBatchAction('valider', event.ids);
    }
  }

  private executeBatchAction(action: 'valider' | 'rejeter', ids: number[]): void {
    this.batchLoading = true;
    this.demandeInscriptionService.batchUpdateStatus(ids, action, this.commentaireReponse).subscribe({
      next: (res) => {
        this.selectedIds = [];
        this.batchLoading = false;
        this.getDemandes();
      },
      error: () => { this.batchLoading = false; }
    });
  }

  confirmerAction(): void {
    if (this.selectedIds.length > 0) {
      this.executeBatchAction('rejeter', this.selectedIds);
      this.showReponseModal = false;
    }
  }

  onItemAction(event: { item: any; action: string }): void {
    const { item, action } = event;
    if (action === 'valider') {
      this.executeBatchAction('valider', [Number(item.id)]);
    } else if (action === 'rejeter') {
      this.selectedIds = [Number(item.id)];
      this.commentaireReponse = undefined;
      this.showReponseModal = true;
    } else if (action === 'voirDetails') {
      this.voirDetails(item.id);
    } else if (action === 'voirDocuments') {
      this.openDocumentsModal(item);
    }
  }

  openDocumentsModal(item: any): void {
    const docs = item._documents || []
    const nom = item.utilisateur ? `${item.utilisateur.nom || ''} ${item.utilisateur.prenoms || ''}`.trim() : `#${item.utilisateurId}`
    this.selectedDemandeTitle = `Documents - ${nom}`
    this.selectedDemandeDocs = docs
    this.showDocumentsModal = true
  }

  closeDocumentsModal(): void {
    this.showDocumentsModal = false
    this.selectedDemandeDocs = []
    this.selectedDemandeTitle = ''
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getDemandes();
  }

  voirDetails(id?: string): void {
    if (id) this.router.navigate(['/inscription/comite-orientation', id]);
  }

  getEtatBadgeClass(statut?: string): string {
    switch (statut) {
      case 'valide': return 'bg-green-100 text-green-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  }

  getEtatLabel(statut?: string): string {
    switch (statut) {
      case 'valide': return 'Validée';
      case 'rejete': return 'Rejetée';
      default: return 'En attente';
    }
  }

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
