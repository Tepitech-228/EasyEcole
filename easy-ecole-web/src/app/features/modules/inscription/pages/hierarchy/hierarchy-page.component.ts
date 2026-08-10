import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { SalleDeClasseService } from 'src/app/data/modules/inscription/services/salle-de-classe.service';
import { SalleDeClasse } from 'src/app/data/modules/inscription/models/SalleDeClasse.model';

interface HierarchyNode {
  id: string;
  type: 'annee' | 'niveau' | 'parcours' | 'salle' | 'semestre' | 'ue' | 'cours';
  label: string;
  data?: any;
  children?: HierarchyNode[];
  expanded?: boolean;
  path?: {
    anneeId?: string;
    niveauId?: string;
    parcoursId?: string;
    salleId?: string;
  };
}

@Component({
  selector: 'app-hierarchy-page',
  templateUrl: './hierarchy-page.component.html',
  styleUrls: ['./hierarchy-page.component.scss']
})
export class HierarchyPageComponent implements OnInit {
  tree: HierarchyNode[] = [];
  filteredTree: HierarchyNode[] = [];
  loading = false;
  selectedNode: HierarchyNode | null = null;
  selectedCoursList: Cours[] = [];

  searchTerm = '';
  selectedYearId = '';
  selectedNiveauId = '';
  selectedParcoursId = '';
  selectedSalleId = '';

  salles: SalleDeClasse[] = [];

  constructor(
    private http: HttpClient,
    private salleService: SalleDeClasseService
  ) {}

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.API_MODULES.INSCRIPTION}/hierarchy`).subscribe({
      next: (data) => {
        this.tree = this.buildTree(data);
        this.filteredTree = this.tree;
        this.loadSalles();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private loadSalles(): void {
    this.salleService.getAll().subscribe({
      next: (salles) => {
        this.salles = salles || [];
        this.attachSallesToTree();
        this.expandAllNodes(this.tree);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erreur chargement salles :', err);
      }
    });
  }

  private buildTree(data: any[]): HierarchyNode[] {
    if (!data) return [];
    return data.map(item => this.buildNode(item, {}));
  }

  private buildNode(item: any, parentPath: any): HierarchyNode {
    const nodePath = { ...parentPath };
    if (item.type === 'annee') nodePath.anneeId = String(item.data?.id || item.id || '');
    if (item.type === 'niveau') nodePath.niveauId = String(item.data?.id || item.id || '');
    if (item.type === 'parcours') nodePath.parcoursId = String(item.data?.id || item.id || '');

    const node: HierarchyNode = {
      id: String(item.id || `${item.type}-${Math.random()}`),
      type: item.type || 'parcours',
      label: item.label || item.libelle || item.titre || item.intitule || item.code || '',
      data: item.data || item,
      expanded: false,
      path: nodePath,
      children: item.children ? item.children.map((child: any) => this.buildNode(child, nodePath)) : undefined
    };

    return node;
  }

  private attachSallesToTree(): void {
    const sallesByParcours = new Map<string, SalleDeClasse[]>();
    this.salles.forEach(salle => {
      const parcoursId = String(salle.parcoursId || '');
      if (!parcoursId) return;
      const list = sallesByParcours.get(parcoursId) || [];
      list.push(salle);
      sallesByParcours.set(parcoursId, list);
    });

    this.tree = this.tree.map(node => this.attachSallesToNode(node, sallesByParcours));
    this.filteredTree = this.tree;
  }

  private expandAllNodes(nodes: HierarchyNode[]): void {
    nodes.forEach(node => {
      if (node.children?.length) {
        node.expanded = true;
        this.expandAllNodes(node.children);
      }
    });
  }

  private attachSallesToNode(node: HierarchyNode, sallesByParcours: Map<string, SalleDeClasse[]>): HierarchyNode {
    const children = node.children ? node.children.map(child => this.attachSallesToNode(child, sallesByParcours)) : [];

    if (node.type === 'parcours') {
      const salleNodes = (sallesByParcours.get(String(node.data?.id)) || []).map(salle => ({
        id: `salle-${salle.id}`,
        type: 'salle' as const,
        label: salle.libelle || 'Salle',
        data: salle,
        expanded: false,
        path: { ...node.path, salleId: String(salle.id) }
      }));

      return {
        ...node,
        children: [...children, ...salleNodes]
      };
    }

    return {
      ...node,
      children: children.length ? children : undefined
    };
  }

  toggle(node: HierarchyNode): void {
    if (node.children?.length) {
      node.expanded = !node.expanded;
    }
  }

  select(node: HierarchyNode): void {
    this.selectedNode = node;
    if (node.type === 'cours' && node.data) {
      this.selectedCoursList = [node.data as Cours];
    } else if (node.children) {
      this.selectedCoursList = this.collectCours(node.children);
    } else {
      this.selectedCoursList = [];
    }
  }

  private collectCours(children: HierarchyNode[]): Cours[] {
    const result: Cours[] = [];
    for (const child of children) {
      if (child.type === 'cours' && child.data) {
        result.push(child.data as Cours);
      }
      if (child.children) {
        result.push(...this.collectCours(child.children));
      }
    }
    return result;
  }

  get coursData(): any {
    if (!this.selectedNode) return null;
    if (this.selectedNode.type === 'cours') return this.selectedNode.data;
    if (this.selectedNode.type === 'ue') return this.selectedNode.data?.cours || this.selectedCoursList[0] || null;
    return null;
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'annee': return '🗓️';
      case 'niveau': return '🎓';
      case 'parcours': return '📚';
      case 'salle': return '🏫';
      case 'semestre': return '📅';
      case 'ue': return '📋';
      case 'cours': return '📝';
      default: return '📄';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'annee': return 'Année';
      case 'niveau': return 'Niveau';
      case 'parcours': return 'Filière';
      case 'salle': return 'Salle';
      case 'semestre': return 'Semestre';
      case 'ue': return 'UE';
      case 'cours': return 'Cours';
      default: return 'Élément';
    }
  }

  get yearOptions(): { id: string; label: string }[] {
    return this.tree.map(node => ({ id: node.path?.anneeId || node.id, label: node.label }));
  }

  get niveauOptions(): { id: string; label: string }[] {
    const items = new Map<string, string>();
    this.tree.forEach(annee => annee.children?.forEach(niveau => {
      if (niveau.path?.niveauId) items.set(niveau.path.niveauId, niveau.label);
    }));
    return Array.from(items.entries()).map(([id, label]) => ({ id, label }));
  }

  get parcoursOptions(): { id: string; label: string }[] {
    const items = new Map<string, string>();
    this.tree.forEach(annee => annee.children?.forEach(niveau => niveau.children?.forEach(parcours => {
      if (parcours.path?.parcoursId) items.set(parcours.path.parcoursId, parcours.label);
    })));
    return Array.from(items.entries()).map(([id, label]) => ({ id, label }));
  }

  get salleOptions(): { id: string; label: string }[] {
    return this.salles.map(salle => ({ id: String(salle.id), label: salle.libelle || `Salle ${salle.id}` }));
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedYearId || this.selectedNiveauId || this.selectedParcoursId || this.selectedSalleId);
  }

  applyFilters(): void {
    this.filteredTree = this.filterNodes(this.tree);
  }

  private filterNodes(nodes: HierarchyNode[]): HierarchyNode[] {
    const result: HierarchyNode[] = [];

    for (const node of nodes) {
      const children = node.children ? this.filterNodes(node.children) : [];
      const nodeMatches = this.nodeMatchesFilters(node);
      if (nodeMatches || children.length > 0) {
        result.push({ ...node, children: children.length ? children : undefined });
      }
    }

    return result;
  }

  private nodeMatchesFilters(node: HierarchyNode): boolean {
    if (this.searchTerm) {
      const value = node.label || '';
      if (!value.toLowerCase().includes(this.searchTerm.toLowerCase())) {
        return false;
      }
    }
    if (this.selectedYearId && node.path?.anneeId !== this.selectedYearId) {
      return false;
    }
    if (this.selectedNiveauId && node.path?.niveauId !== this.selectedNiveauId) {
      return false;
    }
    if (this.selectedParcoursId && node.path?.parcoursId !== this.selectedParcoursId) {
      return false;
    }
    if (this.selectedSalleId && node.path?.salleId !== this.selectedSalleId) {
      return false;
    }
    return true;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedYearId = '';
    this.selectedNiveauId = '';
    this.selectedParcoursId = '';
    this.selectedSalleId = '';
    this.applyFilters();
  }
}
