import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DeliberationService } from '../../services/deliberation.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DossierNode, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';

@Component({
  selector: 'app-deliberations-page',
  templateUrl: './deliberations-page.component.html',
  styleUrls: ['./deliberations-page.component.scss']
})
export class DeliberationsPageComponent extends BaseComponentClass implements OnInit {
  deliberations: any[] = [];
  loading: boolean = false;
  batchLoading: boolean = false;
  showForm: boolean = false;
  formData: any = { libelle: '', classeId: '', anneeAcademiqueId: '', periode: 'semestre1', date: '', sessionType: 'initiale' };

  classes: Classe[] = [];
  annees: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  sessions: Session[] = [];
  dataLoaded: boolean = false;

  selectedAnneeId: string = '';
  selectedNiveauId: string = '';
  selectedParcoursId: string = '';
  filterStatut: string = '';
  filterPeriode: string = '';

  currentPage: number = 1;
  pageSize: number = 50;
  totalItems: number = 0;
  totalPages: number = 1;

  selectedIds: number[] = [];

  treeNodes: DossierNode[] = [];

  itemColumns = [
    { key: 'libelle', label: 'Délibération' },
    { key: 'periodeLabel', label: 'Période' },
    { key: 'dateFormatted', label: 'Date' },
    { key: 'effectif', label: 'Effectif' },
    { key: 'admis', label: 'Admis' },
    { key: 'statut', label: 'Statut' }
  ];

  batchActions: BatchAction[] = [
    { label: 'Détails', color: 'blue', action: 'details', icon: 'visibility' },
    { label: 'Clôturer', color: 'green', action: 'cloturer', icon: 'lock' },
    { label: 'Publier', color: 'purple', action: 'publier', icon: 'publish' },
    { label: 'Supprimer', color: 'red', action: 'supprimer', icon: 'delete' }
  ];

  constructor(
    private deliberationService: DeliberationService,
    private classeService: ClasseService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
  ) { super(); }

  ngOnInit(): void {
    this.classeService.getAll().subscribe(data => this.classes = data);
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
      error: () => this.dataLoaded = true
    });
    this.charger();
  }

  onFilterChange(filters: { anneeId: string; niveauId: string; parcoursId: string }): void {
    this.selectedAnneeId = filters.anneeId;
    this.selectedNiveauId = filters.niveauId;
    this.selectedParcoursId = filters.parcoursId;
    this.currentPage = 1;
    this.charger();
  }

  charger(): void {
    this.loading = true;
    const params: any = { page: this.currentPage, limit: this.pageSize };
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId;
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId;
    if (this.filterStatut) params.statut = this.filterStatut;
    if (this.filterPeriode) params.periode = this.filterPeriode;

    this.deliberationService.getAll(params).subscribe({
      next: (res: any) => {
        this.deliberations = res.data || [];
        this.totalItems = res.pagination?.total || this.deliberations.length;
        this.totalPages = res.pagination?.totalPages || 1;
        this.currentPage = res.pagination?.page || 1;
        this.buildTreeNodes();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  resetFiltres(): void {
    this.selectedAnneeId = '';
    this.selectedNiveauId = '';
    this.selectedParcoursId = '';
    this.filterStatut = '';
    this.filterPeriode = '';
    this.currentPage = 1;
    this.charger();
  }

  get nbPlanifiees(): number { return this.deliberations.filter(d => d.statut === 'planifiee').length; }
  get nbEnCours(): number { return this.deliberations.filter(d => d.statut === 'en_cours').length; }
  get nbCloturees(): number { return this.deliberations.filter(d => d.statut === 'cloturee').length; }
  get nbPubliees(): number { return this.deliberations.filter(d => d.statut === 'publiee').length; }
  get nbContestees(): number { return this.deliberations.filter(d => d.statut === 'contestee').length; }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'publiee': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
      case 'contestee': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'cloturee': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'en_cours': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      case 'planifiee': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'publiee': return 'Publiée';
      case 'contestee': return 'Contestée';
      case 'cloturee': return 'Clôturée';
      case 'en_cours': return 'En cours';
      case 'planifiee': return 'Planifiée';
      default: return statut;
    }
  }

  private buildTreeNodes(): void {
    const groups: any = {};

    for (const d of this.deliberations) {
      d.periodeLabel = d.periode === 'semestre1' ? 'S1' : d.periode === 'semestre2' ? 'S2' : d.periode === 'semestre3' ? 'S3' : d.periode === 'semestre4' ? 'S4' : d.periode === 'semestre5' ? 'S5' : d.periode === 'semestre6' ? 'S6' : d.periode;
      d.dateFormatted = d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '-';

      const anneeKey = d.anneeAcademiqueId || 'sans-annee';
      const niveauKey = d.classe?.niveauEtudeId || 'sans-niveau';
      const classeLabel = d.classe?.libelle || 'Sans classe';

      if (!groups[anneeKey]) groups[anneeKey] = {};
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = {};
      if (!groups[anneeKey][niveauKey][classeLabel]) groups[anneeKey][niveauKey][classeLabel] = { items: [] };

      groups[anneeKey][niveauKey][classeLabel].items.push(d);
    }

    this.treeNodes = Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: this.getAnneeLibelle(anneeKey),
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, classes]: [string, any]) => ({
        type: 'niveau' as const,
        label: this.getNiveauLibelle(niveauKey),
        expanded: true,
        children: Object.entries(classes).map(([classeLabel, classeData]: [string, any]) => ({
          type: 'parcours' as const,
          label: classeLabel,
          expanded: true,
          items: classeData.items
        }))
      }))
    }));
  }

  onSelectionChange(event: { ids: number[] }): void {
    this.selectedIds = event.ids;
  }

  onBatchAction(event: { action: string; ids: number[] }): void {
    if (event.action === 'details' || event.ids.length === 0) return;
    if (event.action === 'supprimer' && !confirm('Supprimer ces délibérations ?')) return;
    this.batchLoading = true;
    this.executeSequential(event.action, event.ids);
  }

  onItemAction(event: { item: any; action: string }): void {
    if (event.action === 'details') {
      return;
    }
    if (event.action === 'supprimer' && !confirm('Supprimer cette délibération ?')) return;
    this.deliberationServiceAction(event.action, event.item.id).subscribe({
      next: () => this.charger(),
      error: () => this.charger()
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.charger();
  }

  private executeSequential(action: string, ids: number[]): void {
    let index = 0;
    const runNext = () => {
      if (index >= ids.length) {
        this.batchLoading = false;
        this.selectedIds = [];
        this.charger();
        return;
      }
      this.deliberationServiceAction(action, ids[index]).subscribe({
        next: () => { index++; runNext(); },
        error: () => { index++; runNext(); }
      });
    };
    runNext();
  }

  private deliberationServiceAction(action: string, id: number) {
    switch (action) {
      case 'cloturer': return this.deliberationService.cloturer(id);
      case 'publier': return this.deliberationService.publier(id);
      case 'supprimer': return this.deliberationService.delete(id);
      default: throw new Error('Action inconnue: ' + action);
    }
  }

  ouvrirFormulaire(): void {
    this.formData = { libelle: '', classeId: '', anneeAcademiqueId: '', periode: 'semestre1', date: '', sessionType: 'initiale' };
    this.showForm = true;
  }

  fermerFormulaire(): void {
    this.showForm = false;
  }

  creerDeliberation(): void {
    if (!this.formData.libelle || !this.formData.classeId || !this.formData.anneeAcademiqueId || !this.formData.date) return;
    this.deliberationService.create(this.formData).subscribe({
      next: () => {
        this.fermerFormulaire();
        this.charger();
      },
      error: (err) => console.error('Erreur création:', err)
    });
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }

  private getAnneeLibelle(id: string): string {
    if (id === 'sans-annee') return 'Sans année';
    return this.annees.find(a => String(a.id) === String(id))?.libelle || `Année #${id}`;
  }

  private getNiveauLibelle(id: string): string {
    if (id === 'sans-niveau') return 'Sans niveau';
    return this.niveaux.find(n => String(n.id) === String(id))?.libelle || `Niveau #${id}`;
  }
}
