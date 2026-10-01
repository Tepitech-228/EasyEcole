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

/** Gravité d'un statut d'échéance : sert à déterminer le statut d'un dossier. */
const GRAVITE_STATUT: { [cle: string]: number } = { partiel: 1, impaye: 2, en_retard: 3 };

/** Une échéance non soldée, enrichie pour l'affichage. */
export interface EcheanceVue {
  id: string;
  type: 'Inscription' | 'Scolarité';
  numeroEcheance: string;
  moisConcerne: string;
  dateLimite: Date | null;
  montant: number;
  montantPaye: number;
  restant: number;
  statut: 'impaye' | 'partiel' | 'en_retard';
  retardJours: number;
}

/** Une ligne du tableau : un étudiant, avec son total et son ancienneté. */
export interface LigneImpaye {
  cle: string;
  donnee: ImpayesDataItem;
  nomComplet: string;
  matricule: string;
  annee: string;
  filiere: string;
  niveau: string;
  classe: string;
  cycle: string;
  nbEcheances: number;
  total: number;
  paye: number;
  reste: number;
  ancienneteJours: number;
  ancienneteLabel: string;
  statutPire: 'impaye' | 'partiel' | 'en_retard';
  echeances: EcheanceVue[];
}

/** Met en forme un retard en jours de façon lisible (« 5 j », « 3 mois », « 1 an 2 mois »). */
function libelleAnciennite(jours: number): string {
  if (!jours || jours <= 0) return '—';
  if (jours < 31) return `${jours} j`;
  const mois = Math.floor(jours / 30);
  if (mois < 12) return `${mois} mois`;
  const annees = Math.floor(jours / 365);
  const resteMois = Math.floor((jours % 365) / 30);
  return resteMois > 0 ? `${annees} an${annees > 1 ? 's' : ''} ${resteMois} mois` : `${annees} an${annees > 1 ? 's' : ''}`;
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
        this.loading = false;
      },
      error: (err) => {
        console.error('[Impayes] Erreur de chargement:', err);
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
    this.page = 1;
    this.applyFilters();
  }

  onCycleChange(): void {
    this.selectedFiliereId = '';
    this.selectedNiveauId = '';
    this.selectedClasseId = '';
    this.parcoursFiltres = [];
    this.niveauxFiltres = [];
    this.classesFiltres = [];
    this.page = 1;

    if (this.selectedCycle) {
      this.parcoursFiltres = this.parcoursList.filter(p => p.type === this.selectedCycle);
    }
    this.applyFilters();
  }

  onFiliereChange(): void {
    this.selectedNiveauId = '';
    this.selectedClasseId = '';
    this.niveauxFiltres = [];
    this.classesFiltres = [];
    this.page = 1;

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
    this.page = 1;

    if (this.selectedNiveauId) {
      this.classesFiltres = this.classes.filter(c => String(c.niveauEtudeId) === String(this.selectedNiveauId));
    }
    this.applyFilters();
  }

  onSemestreChange(): void {
    this.page = 1;
    this.applyFilters();
  }

  onClasseChange(): void {
    this.page = 1;
    this.applyFilters();
  }

  onMoisChange(): void {
    this.page = 1;
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

  // ── Réinitialisation des filtres ──
  resetFilters(): void {
    this.selectedAnneeId = '';
    this.selectedCycle = '';
    this.selectedFiliereId = '';
    this.selectedNiveauId = '';
    this.selectedSemestre = '';
    this.selectedClasseId = '';
    this.selectedMois = '';
    this.searchTerm = '';
    this.niveauxFiltres = [];
    this.parcoursFiltres = [];
    this.classesFiltres = [];
    this.page = 1;
    this.applyFilters();
  }

  // ── Application des filtres et chargement ──
  private applyFilters(): void {
    this.loadImpayes();
  }

  // ── Tri du tableau ──
  triPar: 'reste' | 'nom' | 'retard' = 'reste';
  triSens: 'asc' | 'desc' = 'desc';

  /** Bascule le tri : même colonne → inverse le sens, sinon nouveau tri. */
  trier(par: 'reste' | 'nom' | 'retard'): void {
    if (this.triPar === par) {
      this.triSens = this.triSens === 'asc' ? 'desc' : 'asc';
      return;
    }
    this.triPar = par;
    // Un nom se lit A→Z, une dette du plus gros au plus petit.
    this.triSens = par === 'nom' ? 'asc' : 'desc';
  }

  /** Classe CSS de l'en-tête de colonne, pour afficher la flèche active. */
  triIcone(par: 'reste' | 'nom' | 'retard'): string {
    if (this.triPar !== par) return 'unfold_more';
    return this.triSens === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // ── Vue tabulaire (remplace l'arbre à 7 niveaux) ──
  //
  // Un tableau plat d'une ligne par étudiant est la seule vue exploitable pour
  // un suivi de recouvrement : on voit immédiatement QUI doit QUOI et depuis
  // COMBIEN DE TEMPS, et l'on peut trier. L'ancien arbre imposait sept clics
  // pour atteindre le moindre étudiant.
  get lignes(): LigneImpaye[] {
    const built = this.allImpayesData.map(d => this.versLigne(d));
    const sens = this.triSens === 'asc' ? 1 : -1;
    return built.sort((a, b) => {
      if (this.triPar === 'nom') return a.nomComplet.localeCompare(b.nomComplet, 'fr') * sens;
      if (this.triPar === 'retard') return (a.ancienneteJours - b.ancienneteJours) * sens;
      return (a.reste - b.reste) * sens;
    });
  }

  private versLigne(d: ImpayesDataItem): LigneImpaye {
    const echeances: EcheanceVue[] = (d.echeancesNonSoldees || []).map(e => {
      const dateLimite = e.dateLimite ? new Date(e.dateLimite) : null;
      return {
        id: e.id,
        type: e.type === 'inscription' ? 'Inscription' : 'Scolarité',
        numeroEcheance: `N° ${e.numeroEcheance}`,
        moisConcerne: e.moisConcerne,
        dateLimite,
        montant: this.toNumber(e.montant),
        montantPaye: this.toNumber(e.montantPaye),
        restant: this.toNumber(e.montant) - this.toNumber(e.montantPaye),
        statut: e.statut,
        retardJours: dateLimite ? Math.max(0, Math.floor((Date.now() - dateLimite.getTime()) / 86400000)) : 0
      };
    });

    // Ancienneté = retard de la plus ancienne échéance du dossier.
    const ancienneteJours = echeances.reduce((max, e) => Math.max(max, e.retardJours), 0);

    // Statut du dossier = statut le plus grave parmi ses échéances.
    const statutPire = echeances.reduce<'impaye' | 'partiel' | 'en_retard'>((pire, e) => {
      return (GRAVITE_STATUT[e.statut] || 0) > (GRAVITE_STATUT[pire] || 0) ? e.statut : pire;
    }, 'partiel');

    const total = echeances.reduce((s, e) => s + e.montant, 0);
    const paye = echeances.reduce((s, e) => s + e.montantPaye, 0);

    return {
      // Clé stable et unique : l'identifiant de l'étudiant, JAMAIS son nom
      // (deux homonymes partagent le même nom complet : le détail affiché
      // était alors celui du mauvais student).
      cle: d.etudiant.id,
      donnee: d,
      nomComplet: `${d.etudiant.nom} ${d.etudiant.prenoms}`.trim(),
      matricule: d.etudiant.matricule,
      annee: d.anneeAcademique?.libelle || '—',
      filiere: d.parcours?.titre || '—',
      niveau: d.niveau?.libelle || '—',
      classe: d.classe?.libelle || '—',
      cycle: d.parcours?.type || '—',
      nbEcheances: echeances.length,
      total,
      paye,
      reste: this.toNumber(d.totalRestant),
      ancienneteJours,
      ancienneteLabel: libelleAnciennite(ancienneteJours),
      statutPire,
      echeances
    };
  }

  libelleStatut(statut: 'impaye' | 'partiel' | 'en_retard'): string {
    return statut === 'impaye' ? 'Impayé' : statut === 'partiel' ? 'Partiel' : 'En retard';
  }

  // ── Pagination ──
  //
  // L'API est déjà paginée (page/limit) mais l'ancien écran n'affichait aucun
  // pagination : au-delà de 20 étudiants, l'utilisateur croyait voir la totalité
  // alors que seul le premier lot était chargé. Les contrôles sont réintroduits.
  get peutPrecedent(): boolean {
    return this.page > 1;
  }

  get peutSuivant(): boolean {
    return this.page < this.totalPages;
  }

  /** Numéros de page à afficher, avec fenêtre glissante autour de la page courante. */
  get pages(): number[] {
    const total = this.totalPages;
    if (total <= 1) return [];
    const fenetre = 2;
    let debut = Math.max(1, this.page - fenetre);
    let fin = Math.min(total, this.page + fenetre);
    if (total > 7) {
      if (debut === 1) fin = Math.min(total, 1 + fenetre * 2);
      else if (fin === total) debut = Math.max(1, total - fenetre * 2);
    }
    const out: number[] = [];
    for (let p = debut; p <= fin; p++) out.push(p);
    return out;
  }

  /** « Affichage de 21 à 40 sur 137 » */
  get libellePlage(): string {
    if (this.total === 0) return 'Aucun résultat';
    const debut = (this.page - 1) * this.limit + 1;
    const fin = Math.min(this.page * this.limit, this.total);
    return `Affichage de ${debut} à ${fin} sur ${this.total} étudiant${this.total > 1 ? 's' : ''}`;
  }

  /** Incrémente la taille de page (50 / 100) pour un traitement par lot. */
  get optionsLimit(): number[] {
    return [20, 50, 100];
  }

  onLimitChange(): void {
    this.page = 1;
    this.loadImpayes();
  }

  // ── Filtres : repli et résumé actif ──
  filtresOuverts = true;

  basculerFiltres(): void {
    this.filtresOuverts = !this.filtresOuverts;
  }

  /**
   * Résumé des filtres actifs, affiché sous forme de puces. Sans cela, en
   * présence de huit critères combinés, l'utilisateur ne sait plus pourquoi la
   * liste est courte.
   */
  get filtresActifs(): Array<{ label: string; valeur: string; clear: () => void }> {
    const out: Array<{ label: string; valeur: string; clear: () => void }> = [];
    if (this.selectedAnneeId) {
      out.push({
        label: 'Année',
        valeur: this.annees.find(a => String(a.id) === String(this.selectedAnneeId))?.libelle || this.selectedAnneeId,
        clear: () => { this.selectedAnneeId = ''; this.onAnneeChange(); }
      });
    }
    if (this.selectedCycle) {
      out.push({ label: 'Cycle', valeur: this.selectedCycle, clear: () => { this.selectedCycle = ''; this.onCycleChange(); } });
    }
    if (this.selectedFiliereId) {
      out.push({
        label: 'Filière',
        valeur: this.parcoursList.find(p => String(p.id) === String(this.selectedFiliereId))?.titre || this.selectedFiliereId,
        clear: () => { this.selectedFiliereId = ''; this.onFiliereChange(); }
      });
    }
    if (this.selectedNiveauId) {
      out.push({
        label: 'Niveau',
        valeur: this.niveaux.find(n => String(n.id) === String(this.selectedNiveauId))?.libelle || this.selectedNiveauId,
        clear: () => { this.selectedNiveauId = ''; this.onNiveauChange(); }
      });
    }
    if (this.selectedSemestre) {
      out.push({ label: 'Semestre', valeur: this.selectedSemestre, clear: () => { this.selectedSemestre = ''; this.onSemestreChange(); } });
    }
    if (this.selectedClasseId) {
      out.push({
        label: 'Classe',
        valeur: this.classes.find(c => String(c.id) === String(this.selectedClasseId))?.libelle || this.selectedClasseId,
        clear: () => { this.selectedClasseId = ''; this.onClasseChange(); }
      });
    }
    if (this.selectedMois !== '') {
      out.push({
        label: 'Mois',
        valeur: MOIS_OPTIONS.find(m => m.value === this.selectedMois)?.label || String(this.selectedMois),
        clear: () => { this.selectedMois = ''; this.onMoisChange(); }
      });
    }
    if (this.searchTerm.trim()) {
      out.push({ label: 'Recherche', valeur: this.searchTerm.trim(), clear: () => { this.searchTerm = ''; this.onSearch(); } });
    }
    return out;
  }

  /** Retirer une puce de filtre. */
  retirerFiltre(index: number): void {
    this.filtresActifs[index]?.clear();
  }

  // ── Résumé financier ──
  get totalPaye(): number {
    return this.allImpayesData.reduce((sum, d) => {
      return sum + d.echeancesNonSoldees.reduce((s: number, e: any) => s + (e.montantPaye || 0), 0);
    }, 0);
  }

  get totalGlobal(): number {
    return this.allImpayesData.reduce((sum, d) => {
      return sum + d.echeancesNonSoldees.reduce((s: number, e: any) => s + (e.montant || 0), 0);
    }, 0);
  }

  get totalRestant(): number {
    return this.allImpayesData.reduce((sum, d) => sum + (d.totalRestant || 0), 0);
  }

  get totalPayeString(): string {
    return this.formatMontant(this.totalPaye);
  }

  get totalGlobalString(): string {
    return this.formatMontant(this.totalGlobal);
  }

  get totalRestantString(): string {
    return this.formatMontant(this.totalRestant);
  }

  /** Nombre total d'échéances non soldées sur la page courante. */
  get nbEcheancesTotal(): number {
    return this.allImpayesData.reduce((s, d) => s + (d.echeancesNonSoldees?.length || 0), 0);
  }

  /** Retard le plus important tous dossiers confondus (indicateur de risque). */
  get ancienneteMax(): number {
    return this.allImpayesData.reduce((max, d) => {
      const echeances = d.echeancesNonSoldees || [];
      for (const e of echeances) {
        if (!e.dateLimite) continue;
        const jours = Math.max(0, Math.floor((Date.now() - new Date(e.dateLimite).getTime()) / 86400000));
        if (jours > max) max = jours;
      }
      return max;
    }, 0);
  }

  // ── Détail étudiant ──
  etudiantSelectionne: ImpayesDataItem | null = null;

  voirDetailEtudiant(etudiant: ImpayesDataItem): void {
    this.etudiantSelectionne = etudiant;
  }

  fermerDetailEtudiant(): void {
    this.etudiantSelectionne = null;
  }

  get etudiantPaye(): number {
    if (!this.etudiantSelectionne) return 0;
    return this.etudiantSelectionne.echeancesNonSoldees.reduce((s: number, e: any) => s + (e.montantPaye || 0), 0);
  }

  get etudiantRestant(): number {
    if (!this.etudiantSelectionne) return 0;
    return this.etudiantSelectionne.totalRestant || 0;
  }

  get etudiantTotal(): number {
    if (!this.etudiantSelectionne) return 0;
    return this.etudiantSelectionne.echeancesNonSoldees.reduce((s: number, e: any) => s + (e.montant || 0), 0);
  }

  /** Ligne enrichie de l'étudiant ouvert dans la modale (ancienneté, statut). */
  get etudiantLigne(): LigneImpaye | null {
    if (!this.etudiantSelectionne) return null;
    return this.versLigne(this.etudiantSelectionne);
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
}
