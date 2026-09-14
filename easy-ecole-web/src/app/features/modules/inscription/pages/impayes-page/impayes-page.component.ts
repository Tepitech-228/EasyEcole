import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ImpayesService, ImpayesDataItem, ImpayesResponse } from 'src/app/data/modules/inscription/services/impayes.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { environment } from 'src/environments/environment';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { combineLatest } from 'rxjs';
import { untilDestroyed } from 'src/app/core/utils/take-until-destroy';
import { ToastService } from 'src/app/core/services/toast.service';

const MOIS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

/** Mapping mois (1-12) → semestre (mois 1-6 → Semestre 1, 7-12 → Semestre 2) */
function moisToSemestre(numeroMois: number): string {
  if (numeroMois >= 1 && numeroMois <= 6) return 'Semestre 1';
  if (numeroMois >= 7 && numeroMois <= 12) return 'Semestre 2';
  return '';
}

/** Dériver le semestre depuis le moisConcerne "AAAA-MM" de la première échéance */
function deriveSemestreFromEcheances(echeances: any[]): string {
  if (!echeances.length) return '';
  const premierMois = echeances[0]?.moisConcerne;
  if (!premierMois) return '';
  const numero = parseInt(String(premierMois).split('-')[1], 10);
  return Number.isFinite(numero) ? moisToSemestre(numero) : '';
}

@Component({
  selector: 'app-impayes-page',
  templateUrl: './impayes-page.component.html',
  styleUrls: ['./impayes-page.component.scss']
})
export class ImpayesPageComponent extends BaseComponentClass implements OnInit {

  // ── Données brutes ──
  allImpayesData: ImpayesDataItem[] = [];

  // ── Selecteurs de référence ──
  annees: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  classes: Classe[] = [];
  semestres: string[] = [];

  // ── Filtres sélectionnés ──
  selectedAnneeId = '';
  selectedCycle = '';
  selectedFiliereId = '';
  selectedNiveauId = '';
  selectedSemestre = '';
  selectedClasseId = '';
  selectedMois: number | '' = '';
  searchTerm = '';

  // ── Listes filtrées pour cascade ──
  niveauxFiltres: NiveauEtude[] = [];
  parcoursFiltres: Parcours[] = [];
  classesFiltres: Classe[] = [];

  // ── Cycle options ──
  readonly cycleOptions = ['LICENCE', 'MASTER', 'DOCTORAT', 'BTS', 'MBA'];

  // ── Options des mois (accessibles depuis le template) ──
  readonly MOIS_OPTIONS = MOIS_OPTIONS;

  // ── Colonnes de la table d'items ──
  readonly columns: DossierColumn[] = [
    { key: 'type', label: 'Type', width: '100px' },
    { key: 'numeroEcheance', label: 'Échéance/Mois', width: '150px' },
    { key: 'dateLimite', label: 'Date limite', width: '130px' },
    { key: 'montant', label: 'Montant', width: '120px' },
    { key: 'montantPaye', label: 'Payé', width: '100px' },
    { key: 'restant', label: 'Reste', width: '120px' },
    { key: 'statut', label: 'Statut', width: '100px' },
  ];

  readonly batchActions: BatchAction[] = [
    { label: 'Voir détail', color: 'blue', action: 'voir-detail', icon: 'visibility' },
  ];

  loading = true;
  error = false;
  apiErrorMessage = '';

  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  constructor(
    private route: ActivatedRoute,
    private impayesService: ImpayesService,
    private anneeService: AnneeAcademiqueService,
    private niveauService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private classeService: ClasseService,
    private fb: FormBuilder,
    private toastService: ToastService,
  ) {
    super();
  }

  ngOnInit(): void {
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
        this.loadImpayes();
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  // ── Chargement des données impayées ──
  private loadImpayes(): void {
    this.loading = true;
    this.error = false;

    const params: any = {
      page: this.page,
      limit: this.limit,
    };
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId;
    if (this.selectedCycle) params.cycle = this.selectedCycle;
    if (this.selectedFiliereId) params.parcoursId = this.selectedFiliereId;
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId;
    if (this.selectedSemestre) params.semestreId = this.selectedSemestre;
    if (this.selectedClasseId) params.classeId = this.selectedClasseId;
    if (this.selectedMois !== '') params.mois = this.selectedMois;
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();

    this.impayesService.getImpayes(params).pipe(untilDestroyed(this)).subscribe({
      next: (res: ImpayesResponse) => {
        this.allImpayesData = res.data || [];
        this.semestres = res.semestres || [];
        this.total = res.pagination?.total || 0;
        this.totalPages = res.pagination?.totalPages || 0;
        // TODO: le filtrage client est effectué par le getter treeNodes (buildTreeNodes),
        // et les filtres sont déjà transmis au serveur via params.
        // Suppression de cet appel pour casser la boucle infinie loadImpayes → applyFilters → loadImpayes.
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.toastService.error('Erreur lors du chargement des données');
      }
    });
  }

  // ── Cascade de filtres ──
  onAnneeChange(): void {
    this.selectedCycle = '';
    this.selectedFiliereId = '';
    this.selectedNiveauId = '';
    this.selectedSemestre = '';
    this.selectedClasseId = '';
    this.niveauxFiltres = [];
    this.parcoursFiltres = [];
    this.classesFiltres = [];

    if (this.selectedAnneeId) {
      const niveauIds = new Set<string>();
      this.parcoursList
        .filter(p => {
          const session = (p as any).session;
          return session?.anneeAcademiqueId && String(session.anneeAcademiqueId) === String(this.selectedAnneeId);
        })
        .forEach(p => { if (p.niveauEtudeId) niveauIds.add(String(p.niveauEtudeId)); });
      this.niveauxFiltres = niveauIds.size > 0
        ? this.niveaux.filter(n => niveauIds.has(String(n.id!)))
        : this.niveaux;
    }
    this.applyFilters();
  }

  onCycleChange(): void {
    this.selectedFiliereId = '';
    this.parcoursFiltres = [];

    if (this.selectedCycle) {
      this.parcoursFiltres = this.parcoursList.filter(p => p.type === this.selectedCycle);
    }
    this.applyFilters();
  }

  onFiliereChange(): void {
    this.selectedNiveauId = '';
    this.niveauxFiltres = [];

    if (this.selectedFiliereId) {
      const parcours = this.parcoursList.find(p => String(p.id) === String(this.selectedFiliereId));
      if (parcours?.niveauEtudeId) {
        this.niveauxFiltres = this.niveaux.filter(n => String(n.id) === String(parcours.niveauEtudeId));
      }
    }
    this.applyFilters();
  }

  onNiveauChange(): void {
    this.selectedClasseId = '';
    this.classesFiltres = [];

    if (this.selectedNiveauId) {
      this.classesFiltres = this.classes.filter(c => String(c.niveauEtudeId) === String(this.selectedNiveauId));
    }
    this.applyFilters();
  }

  onSemestreChange(): void {
    this.applyFilters();
  }

  onClasseChange(): void {
    this.applyFilters();
  }

  onMoisChange(): void {
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

  // ── Application des filtres et chargement ──
  private applyFilters(): void {
    this.loadImpayes();
  }

  // ── Construction de l'arbre ──
  get treeNodes(): DossierNode[] {
    return this.buildTreeNodes();
  }

  private buildTreeNodes(): DossierNode[] {
    let filtered = this.allImpayesData;

    if (this.selectedAnneeId) {
      filtered = filtered.filter(d => String(d.anneeAcademique.id) === String(this.selectedAnneeId));
    }
    if (this.selectedCycle) {
      filtered = filtered.filter(d => d.parcours.type === this.selectedCycle);
    }
    if (this.selectedFiliereId) {
      filtered = filtered.filter(d => String(d.parcours.id) === String(this.selectedFiliereId));
    }
    if (this.selectedNiveauId) {
      filtered = filtered.filter(d => String(d.niveau.id) === String(this.selectedNiveauId));
    }
    if (this.selectedClasseId) {
      filtered = filtered.filter(d => String(d.classe.id) === String(this.selectedClasseId));
    }
    if (this.selectedMois !== '') {
      filtered = filtered.filter(d =>
        d.echeancesNonSoldees.some(e => {
          const mc = e.moisConcerne ? String(e.moisConcerne).split('-')[1] : '';
          return mc !== '' && parseInt(mc, 10) === this.selectedMois;
        })
      );
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(d => {
        const nom = `${d.etudiant.nom} ${d.etudiant.prenoms}`.toLowerCase();
        const mat = d.etudiant.matricule.toLowerCase();
        return nom.includes(q) || mat.includes(q);
      });
    }

    const groups: { [key: string]: any } = {};

    for (const d of filtered) {
      const anneeKey = d.anneeAcademique.libelle || 'Sans année';
      const cycle = d.parcours.type || 'Sans cycle';
      const cycleKey = `${anneeKey}||${cycle}`;
      const filiereKey = `${cycleKey}||${d.parcours.titre}`;
      const niveauKey = `${filiereKey}||${d.niveau.libelle}`;
      const semestre = deriveSemestreFromEcheances(d.echeancesNonSoldees);
      const semestreKey = semestre ? `${niveauKey}||${semestre}` : `${niveauKey}||Sans semestre`;
      const classeKey = `${semestreKey}||${d.classe.libelle}`;
      const etudiantLabel = `${d.etudiant.nom} ${d.etudiant.prenoms}`;
      const etudiantKey = `${classeKey}||${etudiantLabel}`;

      if (!groups[anneeKey]) groups[anneeKey] = {};
      if (!groups[anneeKey][cycleKey]) groups[anneeKey][cycleKey] = {};
      if (!groups[anneeKey][cycleKey][filiereKey]) groups[anneeKey][cycleKey][filiereKey] = {};
      if (!groups[anneeKey][cycleKey][filiereKey][niveauKey]) groups[anneeKey][cycleKey][filiereKey][niveauKey] = {};
      if (!groups[anneeKey][cycleKey][filiereKey][niveauKey][semestreKey]) groups[anneeKey][cycleKey][filiereKey][niveauKey][semestreKey] = {};
      if (!groups[anneeKey][cycleKey][filiereKey][niveauKey][semestreKey][classeKey]) groups[anneeKey][cycleKey][filiereKey][niveauKey][semestreKey][classeKey] = { items: [] };
      if (!groups[anneeKey][cycleKey][filiereKey][niveauKey][semestreKey][classeKey][etudiantKey]) {
        groups[anneeKey][cycleKey][filiereKey][niveauKey][semestreKey][classeKey][etudiantKey] = { items: [] };
      }

      const studentNode = groups[anneeKey][cycleKey][filiereKey][niveauKey][semestreKey][classeKey][etudiantKey];
      d.echeancesNonSoldees.forEach(e => {
        studentNode.items.push(this.echeanceToItem(e, d));
      });
    }

    return Object.entries(groups).map(([anneeKey, cycles]: [string, any]) => ({
      type: 'annee' as const,
      label: anneeKey,
      expanded: true,
      children: Object.entries(cycles).map(([cycleKey, filieres]: [string, any]) => {
        const cycleLibelle = cycleKey.split('||')[1] || cycleKey;
        return {
          type: 'parcours' as const,
          label: cycleLibelle,
          subtitle: `Cycle`,
          expanded: true,
          children: Object.entries(filieres).map(([filiereKey, niveaux]: [string, any]) => {
            const filiereLibelle = filiereKey.split('||')[2] || filiereKey;
            return {
              type: 'classe' as const,
              label: filiereLibelle,
              subtitle: 'Filière',
              expanded: true,
              children: Object.entries(niveaux).map(([niveauKey, semestres]: [string, any]) => {
                const niveauLibelle = niveauKey.split('||')[3] || niveauKey;
                return {
                  type: 'niveau' as const,
                  label: niveauLibelle,
                  expanded: true,
                  children: Object.entries(semestres).map(([semestreKey, classes]: [string, any]) => {
                    const semestreLibelle = semestreKey.split('||')[4] || semestreKey;
                    return {
                      type: 'semestre' as const,
                      label: semestreLibelle,
                      expanded: true,
                      children: Object.entries(classes).map(([classeKey, etudiants]: [string, any]) => {
                        const classeLibelle = classeKey.split('||')[5] || classeKey;
                        return {
                          type: 'classe' as const,
                          label: classeLibelle,
                          expanded: true,
                          children: Object.entries(etudiants).map(([etudiantKey, group]: [string, any]) => {
                            const etudiantLabel = etudiantKey.split('||').pop() || 'Étudiant inconnu';
                            return {
                              type: 'etudiant' as const,
                              label: etudiantLabel,
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
        };
      })
    }));
  }

  private echeanceToItem(e: any, dataItem: ImpayesDataItem): any {
    return {
      id: e.id,
      type: e.type === 'inscription' ? 'Inscription' : 'Scolarité',
      numeroEcheance: `N° ${e.numeroEcheance}`,
      dateLimite: e.dateLimite ? new Date(e.dateLimite) : null,
      montant: e.montant,
      montantPaye: e.montantPaye || 0,
      restant: (e.montant || 0) - (e.montantPaye || 0),
      statut: e.statut,
      moisConcerne: e.moisConcerne,
    };
  }

  // ── Actions sur les items ──
  onItemAction(event: { item: any, action: string }): void {
    if (event.action === 'voir-detail') {
      this.toastService.info(`Détail échéance : ${event.item.numeroEcheance}`);
    }
  }

  /** Conversion sûre d'un montant en nombre */
  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  /** Formater un montant */
  formatMontant(value: number | undefined | null): string {
    if (value == null || value === 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }

  get totalRestantString(): string {
    return this.formatMontant(this.totalRestant);
  }

  get totalRestant(): number {
    return this.allImpayesData.reduce((sum, d) => sum + (d.totalRestant || 0), 0);
  }
}
