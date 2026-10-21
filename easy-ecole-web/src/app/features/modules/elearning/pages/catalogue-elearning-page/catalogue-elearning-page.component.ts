import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ElearningBudget, ElearningCourse, ElearningFinanceService } from 'src/app/data/modules/elearning/services/elearning-finance.service';

interface TotauxArborescence {
  annees: number;
  parcours: number;
  niveaux: number;
  classes: number;
  cours: number;
  coursEnLigne: number;
  coursEnLigneRattaches: number;
  coursEnLigneNonRattaches: number;
}

type ArbreType =
  | 'annee'
  | 'parcours'
  | 'niveau'
  | 'classe'
  | 'cours'
  | 'coursEnLigne'
  | 'nonRattaches';

export interface ArbreNode {
  type: ArbreType;
  label: string;
  compteur: number;
  expanded: boolean;
  children: ArbreNode[];
  /** Nœud virtuel « Sans classe » */
  virtuel?: boolean;
  /** Id du cours en ligne (utilisé pour la navigation vers la page de détails) */
  id?: number | string;
  statut?: string;
  format?: string | null;
  nbCredits?: number;
  coutTotal?: number | null;
  selection?: ElearningCourse['selection'];
}

@Component({
  selector: 'app-catalogue-elearning-page',
  templateUrl: './catalogue-elearning-page.component.html',
  styleUrls: ['./catalogue-elearning-page.component.scss']
})
export class CatalogueElearningPageComponent extends BaseComponentClass implements OnInit {
  private catalogue: ElearningCourse[] = [];
  fullTree: ArbreNode[] = [];
  filteredTree: ArbreNode[] = [];
  totaux: TotauxArborescence | null = null;
  loading = false;
  error = false;
  searchQuery = '';
  isStudent = false;
  budget: ElearningBudget | null = null;
  budgetError = '';
  actionError = '';
  successMessage = '';
  selectionLoadingId: number | null = null;

  constructor(
    private financeService: ElearningFinanceService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.isStudent = this.rolesValue.isApprenant;
    this.loadArborescence();
    if (this.isStudent) this.loadBudget();
  }

  loadArborescence(): void {
    this.loading = true;
    this.error = false;
    this.searchQuery = '';
    this.financeService.getCatalogue().subscribe({
      next: (data: ElearningCourse[]) => {
        this.catalogue = data;
        this.fullTree = this.buildTree(data);
        this.filteredTree = this.fullTree;
        this.totaux = {
          annees: 1,
          parcours: 0,
          niveaux: 0,
          classes: 0,
          cours: 0,
          coursEnLigne: data.length,
          coursEnLigneRattaches: data.filter(c => !!c.ue).length,
          coursEnLigneNonRattaches: data.filter(c => !c.ue).length
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  /** La rubrique « Non rattachés » est réservée à l'administration */
  get showNonRattaches(): boolean {
    return this.rolesValue.isAdmin || this.rolesValue.isInstitution;
  }

  toggle(node: ArbreNode): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
    }
  }

  onNodeClick(node: ArbreNode): void {
    if (node.type === 'coursEnLigne' && node.id && (!this.isStudent || node.selection?.statut === 'acces_ouvert')) {
      this.router.navigate(['/elearning', node.id]);
      return;
    }
    this.toggle(node);
  }

  loadBudget(): void {
    this.budgetError = '';
    this.financeService.getBudget().subscribe({
      next: budget => {
        this.budget = budget;
        if (this.fullTree.length) {
          this.fullTree = this.buildTree(this.catalogue);
          this.applySearch();
        }
      },
      error: err => this.budgetError = err.error?.message || 'Impossible de charger votre budget e-learning.'
    });
  }

  choisirCours(node: ArbreNode, event: Event): void {
    event.stopPropagation();
    if (!node.id || this.selectionLoadingId !== null) return;
    this.actionError = '';
    this.successMessage = '';
    this.selectionLoadingId = Number(node.id);
    this.financeService.choisirCours(Number(node.id)).subscribe({
      next: () => {
        this.selectionLoadingId = null;
        this.successMessage = `Le cours « ${node.label} » est ajouté à vos cours.`;
        this.loadArborescence();
        this.loadBudget();
      },
      error: err => {
        this.selectionLoadingId = null;
        this.actionError = err.error?.message || 'La sélection du cours a échoué.';
      }
    });
  }

  applySearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredTree = this.fullTree;
      return;
    }
    this.filteredTree = this.filterTree(this.fullTree, q);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applySearch();
  }

  /** Nombre de cours en ligne visibles dans l'arbre courant */
  leafCount(nodes: ArbreNode[]): number {
    return nodes.reduce(
      (sum, n) =>
        sum + (n.type === 'coursEnLigne' ? 1 : this.leafCount(n.children)),
      0
    );
  }

  private buildTree(courses: ElearningCourse[]): ArbreNode[] {
    return [{
      type: 'annee',
      label: this.budget?.anneeAcademique || 'Cours proposés',
      compteur: courses.length,
      expanded: true,
      children: courses.map(course => ({
        type: 'coursEnLigne',
        label: [course.code, course.titre].filter(Boolean).join(' — '),
        compteur: 0,
        expanded: true,
        children: [],
        id: course.id,
        statut: course.statut,
        nbCredits: Number(course.nbCredits),
        coutTotal: course.selection?.coutFige ?? course.coutTotal,
        selection: course.selection
      }))
    }];
  }

  private matchesQuery(node: ArbreNode, ql: string): boolean {
    if (node.type === 'coursEnLigne') {
      return node.label.toLowerCase().includes(ql);
    }
    return node.children.some((child) => this.matchesQuery(child, ql));
  }

  private filterTree(nodes: ArbreNode[], ql: string): ArbreNode[] {
    return nodes
      .filter((node) => this.matchesQuery(node, ql))
      .map((node) => ({
        ...node,
        expanded: true,
        children: node.type === 'coursEnLigne' ? [] : this.filterTree(node.children, ql)
      }));
  }
}
