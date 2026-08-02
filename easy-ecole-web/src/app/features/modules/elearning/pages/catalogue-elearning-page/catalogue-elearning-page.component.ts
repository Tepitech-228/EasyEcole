import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import {
  ArborescenceElearningResponse,
  ArborescenceService,
  CoursEnLigneArbre,
  TotauxArborescence
} from '../../services/arborescence.service';

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
}

@Component({
  selector: 'app-catalogue-elearning-page',
  templateUrl: './catalogue-elearning-page.component.html',
  styleUrls: ['./catalogue-elearning-page.component.scss']
})
export class CatalogueElearningPageComponent extends BaseComponentClass implements OnInit {
  fullTree: ArbreNode[] = [];
  filteredTree: ArbreNode[] = [];
  totaux: TotauxArborescence | null = null;
  loading = false;
  error = false;
  searchQuery = '';

  constructor(private arborescenceService: ArborescenceService, private router: Router) {
    super();
  }

  ngOnInit(): void {
    this.loadArborescence();
  }

  loadArborescence(): void {
    this.loading = true;
    this.error = false;
    this.searchQuery = '';
    this.arborescenceService.getArborescence().subscribe({
      next: (data: ArborescenceElearningResponse) => {
        this.fullTree = this.buildTree(data);
        this.filteredTree = this.fullTree;
        this.totaux = data.totaux;
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
    // Clic sur un cours en ligne → page de détails existante (cours-details-page)
    if (node.type === 'coursEnLigne' && node.id) {
      this.router.navigate(['/elearning', node.id]);
      return;
    }
    this.toggle(node);
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

  private buildTree(data: ArborescenceElearningResponse): ArbreNode[] {
    const annees: ArbreNode[] = data.annees.map((a) => ({
      type: 'annee',
      label: a.libelle,
      compteur: a.compteurCoursEnLigne,
      expanded: true,
      children: a.parcours.map((p) => ({
        type: 'parcours',
        label: p.titre,
        compteur: p.compteurCoursEnLigne,
        expanded: true,
        children: p.niveaux.map((n) => ({
          type: 'niveau',
          label: n.libelle,
          compteur: n.compteurCoursEnLigne,
          expanded: true,
          children: n.classes.map((cl) => ({
            type: 'classe',
            label: cl.libelle,
            compteur: cl.compteurCoursEnLigne,
            expanded: true,
            virtuel: cl.estVirtuel,
            children: cl.cours.map((c) => ({
              type: 'cours',
              label: [c.code, c.intitule].filter(Boolean).join(' — '),
              compteur: c.compteurCoursEnLigne,
              expanded: true,
              children: c.coursEnLigne.map((cel) => this.toCoursEnLigneNode(cel))
            }))
          }))
        }))
      }))
    }));

    if (data.nonRattaches.length > 0 && this.showNonRattaches) {
      annees.push({
        type: 'nonRattaches',
        label: 'Non rattachés',
        compteur: data.nonRattaches.length,
        expanded: true,
        children: data.nonRattaches.map((cel) => this.toCoursEnLigneNode(cel))
      });
    }

    return annees;
  }

  private toCoursEnLigneNode(cel: CoursEnLigneArbre): ArbreNode {
    return {
      type: 'coursEnLigne',
      label: cel.titre,
      compteur: 0,
      expanded: true,
      children: [],
      id: cel.id,
      statut: cel.statut,
      format: cel.format
    };
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
