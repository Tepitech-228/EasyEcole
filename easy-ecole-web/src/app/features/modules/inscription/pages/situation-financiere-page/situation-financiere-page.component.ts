import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/core/services/toast.service';
import { of, Subject } from 'rxjs';
import { combineLatest } from 'rxjs';
import { untilDestroyed } from 'src/app/core/utils/take-until-destroy';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-situation-financiere-page',
  templateUrl: './situation-financiere-page.component.html',
  styleUrls: ['./situation-financiere-page.component.scss']
})
export class SituationFinancierePageComponent extends BaseComponentClass implements OnInit {

  // ── Données brutes ──
  situationData: any[] = [];
  treeNodes: DossierNode[] = [];
  private readonly reloadRequests = new Subject<void>();

  // ── Selecteurs de référence ──
  annees: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  classes: Classe[] = [];

  // ── Filtres sélectionnés ──
  selectedAnneeId = '';
  selectedNiveauId = '';
  selectedParcoursId = '';
  selectedClasseId = '';
  selectedPeriode = '';
  searchTerm = '';

  // ── Listes filtrées pour cascade ──
  niveauxFiltres: NiveauEtude[] = [];
  parcoursFiltres: Parcours[] = [];
  classesFiltres: Classe[] = [];

  // ── Options de période ──
  readonly periodeOptions = [
    { value: 'matin', label: 'Jour' },
    { value: 'soir', label: 'Soir' },
    { value: 'en_ligne', label: 'En ligne' }
  ];

  // ── Colonnes de la table d'items ──
  readonly columns: DossierColumn[] = [
    { key: 'etudiant', label: 'Étudiant' },
    { key: 'matricule', label: 'Matricule' },
    { key: 'totalDu', label: 'Total dû', width: '150px' },
    { key: 'totalPaye', label: 'Payé', width: '130px' },
    { key: 'resteAPayer', label: 'Reste', width: '130px' },
    { key: 'avancement', label: 'Avancement', width: '130px' },
  ];

  // ── Actions sur les items ──
  readonly itemActions: BatchAction[] = [
    { label: 'Situation', color: 'blue', action: 'situation', icon: 'account_balance_wallet' },
  ];

  loading = true;
  error = false;
  apiErrorMessage = '';

  // ── Modal détail ──
  showDetailModal = false;
  selectedEtudiant: any = null;
  detailLoading = false;
  detailData: any = null;
  detailError = '';

  // ── Pagination ──
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  constructor(
    private bordereauService: BordereauService,
    private anneeService: AnneeAcademiqueService,
    private niveauService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private classeService: ClasseService,
    private toastService: ToastService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.reloadRequests.pipe(
      debounceTime(250),
      switchMap(() => {
        this.loading = true;
        this.error = false;
        this.apiErrorMessage = '';
        return this.bordereauService.getSituationFinanciere(this.getSituationParams()).pipe(
          catchError((err) => {
            this.loading = false;
            this.error = true;
            this.apiErrorMessage = err?.error?.message || 'Erreur lors du chargement de la situation financière';
            this.toastService.error(this.apiErrorMessage);
            return of(null);
          })
        );
      })
    ).pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (!res) return;
      this.situationData = res.data || [];
      this.total = res.pagination?.total ?? 0;
      this.totalPages = res.pagination?.totalPages ?? 0;
      this.treeNodes = this.buildTreeNodes(this.situationData);
      this.loading = false;
    });
    this.loadSelects();
  }

  // ── Chargement des référentiels ──
  private loadSelects(): void {
    combineLatest([
      this.anneeService.getAll(),
      this.niveauService.getAll(),
      this.parcoursService.getAll(),
      this.classeService.getAll(),
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([annees, niveaux, parcours, classes]) => {
        this.annees = annees;
        this.niveaux = niveaux;
        this.parcoursList = parcours;
        this.classes = classes;
        this.niveauxFiltres = niveaux;
        this.applyFilters();
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.apiErrorMessage = err?.error?.message || 'Erreur lors du chargement des référentiels';
        this.toastService.error(this.apiErrorMessage);
      }
    });
  }

  private getSituationParams(): any {
    const params: any = {
      page: this.page,
      limit: this.limit,
    };
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId;
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId;
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId;
    if (this.selectedClasseId) params.classeId = this.selectedClasseId;
    if (this.selectedPeriode) params.periode = this.selectedPeriode;
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();
    return params;
  }

  // ── Cascade de filtres ──
  onAnneeChange(): void {
    this.selectedNiveauId = '';
    this.selectedParcoursId = '';
    this.selectedClasseId = '';
    this.niveauxFiltres = [];
    this.parcoursFiltres = [];
    this.classesFiltres = [];

    this.niveauxFiltres = this.niveaux;
    this.applyFilters();
  }

  onNiveauChange(): void {
    this.selectedParcoursId = '';
    this.selectedClasseId = '';
    this.parcoursFiltres = [];
    this.classesFiltres = [];

    if (this.selectedNiveauId) {
      this.parcoursFiltres = this.parcoursList.filter(p => String(p.niveauEtudeId) === String(this.selectedNiveauId));
    }
    this.applyFilters();
  }

  onParcoursChange(): void {
    this.selectedClasseId = '';
    this.classesFiltres = this.selectedParcoursId
      ? this.classes.filter(c =>
        String(c.parcoursId) === String(this.selectedParcoursId) &&
        (!this.selectedNiveauId || String(c.niveauEtudeId) === String(this.selectedNiveauId))
      )
      : [];
    this.applyFilters();
  }

  onClasseChange(): void {
    this.applyFilters();
  }

  onPeriodeChange(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.page = 1;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.applyFilters();
  }

  // ── Application des filtres ──
  private applyFilters(): void {
    this.reloadRequests.next();
  }

  retryLoad(): void {
    this.applyFilters();
  }

  // ── Conversion sûre d'un montant en nombre ──
  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  // ── Formatage FCFA ──
  formatCurrency(value: number | undefined | null): string {
    if (value == null || isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA';
  }

  /** Traduit la période en libellé humain */
  getPeriodeLibelle(periode: string | null | undefined): string {
    if (!periode) return '—';
    const map: Record<string, string> = { matin: 'Jour', soir: 'Soir', en_ligne: 'En ligne' };
    return map[periode] || periode;
  }

  // ── Badge couleur pour statut d'échéance ──
  getBadgeColor(value: string): string {
    switch (value) {
      case 'paye': return 'green';
      case 'partiel': return 'orange';
      case 'impaye': case 'en_retard': return 'red';
      default: return 'gray';
    }
  }

  // ── Arbre hiérarchique ──
  /**
   * Arbre : AnnéeAcadémique → Niveau → Parcours → Filière(classe) → OptionCours(semestre) → Étudiant
   * Chaque feuille étudiant contient un item mappé via situationToItem().
   */
  private buildTreeNodes(data: any[]): DossierNode[] {
    const groups: { [key: string]: any } = {};

    const makeKey = (id: any, label: string): string => JSON.stringify([id == null ? label : String(id), label]);

    for (const s of data) {
      const anneeLibelle: string = s.anneeAcademique?.libelle || 'Sans année';
      const niveauLibelle: string = s.niveau?.libelle || 'Sans niveau';
      const parcoursLibelle: string = s.parcours?.titre || 'Sans parcours';
      const classeLibelle: string = s.classe?.libelle || 'Sans classe';
      const optionCoursLibelle: string = this.getPeriodeLibelle(s.etudiant?.periode);
      const etudiantLabel = s.etudiant ? `${s.etudiant.nom} ${s.etudiant.prenoms}` : 'Étudiant inconnu';

      const anneeKey = makeKey(s.anneeAcademique?.id, anneeLibelle);
      const niveauKey = makeKey(s.niveau?.id, niveauLibelle);
      const parcoursKey = makeKey(s.parcours?.id, parcoursLibelle);
      const classeKey = makeKey(s.classe?.id, classeLibelle);
      const optionKey = makeKey(optionCoursLibelle, optionCoursLibelle);
      const etudiantKey = makeKey(s.etudiant?.id, etudiantLabel);

      if (!groups[anneeKey]) groups[anneeKey] = {};
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey]) groups[anneeKey][niveauKey][parcoursKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey][classeKey]) groups[anneeKey][niveauKey][parcoursKey][classeKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey][classeKey][optionKey]) groups[anneeKey][niveauKey][parcoursKey][classeKey][optionKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey][classeKey][optionKey][etudiantKey]) {
        groups[anneeKey][niveauKey][parcoursKey][classeKey][optionKey][etudiantKey] = { items: [] };
      }
      groups[anneeKey][niveauKey][parcoursKey][classeKey][optionKey][etudiantKey].items.push(this.situationToItem(s));
    }

    const labelOf = (key: string): string => JSON.parse(key)[1];

    return Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: labelOf(anneeKey),
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, parcs]: [string, any]) => {
        return {
          type: 'niveau' as const,
          label: labelOf(niveauKey),
          expanded: true,
          children: Object.entries(parcs).map(([parcoursKey, filieres]: [string, any]) => {
            return {
              type: 'parcours' as const,
              label: labelOf(parcoursKey),
              expanded: true,
              children: Object.entries(filieres).map(([classeKey, options]: [string, any]) => {
                return {
                  type: 'classe' as const,
                  label: labelOf(classeKey),
                  subtitle: 'Classe',
                  expanded: true,
                  children: Object.entries(options).map(([optionKey, etudiants]: [string, any]) => {
                    return {
                      type: 'semestre' as const,
                      label: labelOf(optionKey),
                      subtitle: 'Option cours',
                      expanded: true,
                      children: Object.entries(etudiants).map(([etudiantKey, group]: [string, any]) => {
                        return {
                          type: 'etudiant' as const,
                          label: labelOf(etudiantKey),
                          expanded: false,
                          items: group.items || [],
                        };
                      })
                    };
                  })
                };
              })
            };
          })
        };
      })
    }));
  }

  /** Mapper une donnée situation vers l'item affiché dans le dossier-view */
  private situationToItem(s: any): any {
    const etudiant = s.etudiant || {};
    return {
      id: etudiant.id,
      raw: s,
      matricule: etudiant.matricule || '—',
      etudiant: `${etudiant.nom ?? ''} ${etudiant.prenoms ?? ''}`.trim() || 'Étudiant inconnu',
      totalDu: s.totaux?.totalDu ?? 0,
      totalPaye: s.totaux?.totalPaye ?? 0,
      resteAPayer: s.totaux?.resteAPayer ?? 0,
      avancement: s.totaux?.avancement ?? 0,
      echeancesSoldees: s.echeancesSoldeesCount ?? 0,
    };
  }

  // ── Action sur item : ouvrir le modal détail ──
  onItemAction(event: { item: any, action: string }): void {
    if (event.action === 'situation') {
      this.openDetailModal(event.item);
    }
  }

  private openDetailModal(item: any): void {
    this.selectedEtudiant = item;
    this.detailData = null;
    this.detailError = '';
    this.showDetailModal = true;
    this.detailLoading = true;

    const raw = item?.raw || {};
    const utilisateurId = raw?.etudiant?.id;
    if (!utilisateurId) {
      this.detailLoading = false;
      this.detailError = "Identifiant étudiant absent";
      this.toastService.error(this.detailError);
      return;
    }

    this.bordereauService.getSituationDetail(String(utilisateurId), {
      anneeAcademiqueId: raw.anneeAcademique?.id,
      niveauEtudeId: raw.niveau?.id,
      parcoursId: raw.parcours?.id,
      classeId: raw.classe?.id,
    }).pipe(untilDestroyed(this)).subscribe({
      next: (res: any) => {
        this.detailData = res?.data || res;
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailLoading = false;
        this.detailError = err?.error?.message || "Erreur lors du chargement du détail";
        this.toastService.error(this.detailError);
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedEtudiant = null;
    this.detailData = null;
    this.detailError = '';
  }
}
