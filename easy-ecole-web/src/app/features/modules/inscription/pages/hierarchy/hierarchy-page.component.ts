import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';

interface ArbreNode {
  id: string;
  type: 'parcours' | 'niveau' | 'semestre' | 'ue' | 'cours';
  label: string;
  children?: ArbreNode[];
  data?: any;
  expanded?: boolean;
}

@Component({
  selector: 'app-hierarchy-page',
  templateUrl: './hierarchy-page.component.html',
  styleUrls: ['./hierarchy-page.component.scss']
})
export class HierarchyPageComponent implements OnInit {
  tree: ArbreNode[] = [];
  loading = false;
  selectedNode: ArbreNode | null = null;
  selectedCoursList: Cours[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree() {
    this.loading = true;
    this.http.get<any>(`${environment.API_MODULES.INSCRIPTION}/arbre-pedagogique`).subscribe({
      next: (data) => {
        this.tree = this.buildTree(data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildTree(data: any): ArbreNode[] {
    if (!data) return [];
    if (Array.isArray(data)) {
      return data.map(item => this.mapNode(item));
    }
    return [this.mapNode(data)];
  }

  private mapNode(item: any): ArbreNode {
    const node: ArbreNode = {
      id: item.id || `${item.type}-${Math.random()}`,
      type: item.type || 'parcours',
      label: item.libelle || item.label || item.titre || item.intitule || item.code || '',
      data: item,
      expanded: false,
      children: undefined
    };
    if (item.niveaux || item.parcours || item.semestres || item.ues || item.cours) {
      node.children = [];
      if (item.niveaux) node.children.push(...item.niveaux.map((n: any) => this.mapNode({ ...n, type: 'niveau' })));
      if (item.parcours) node.children.push(...item.parcours.map((p: any) => this.mapNode({ ...p, type: 'parcours' })));
      if (item.semestres) node.children.push(...item.semestres.map((s: any) => this.mapNode({ ...s, type: 'semestre' })));
      if (item.ues) node.children.push(...item.ues.map((u: any) => {
        const n = this.mapNode({ ...u, type: 'ue' });
        if (u.cours && typeof u.cours === 'object') {
          n.children = [this.mapNode({ ...u.cours, type: 'cours' })];
        }
        return n;
      }));
      if (item.cours && typeof item.cours === 'object' && !Array.isArray(item.cours)) {
        node.children.push(this.mapNode({ ...item.cours, type: 'cours' }));
      }
    }
    if (!node.children?.length) node.children = undefined;
    return node;
  }

  toggle(node: ArbreNode) {
    if (node.children?.length) {
      node.expanded = !node.expanded;
    }
  }

  select(node: ArbreNode) {
    this.selectedNode = node;
    if (node.type === 'cours' && node.data) {
      this.selectedCoursList = [node.data as Cours];
    } else if (node.children) {
      this.selectedCoursList = this.collectCours(node.children);
    } else {
      this.selectedCoursList = [];
    }
  }

  private collectCours(children: ArbreNode[]): Cours[] {
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
      case 'parcours': return '📚';
      case 'niveau': return '🎓';
      case 'semestre': return '📅';
      case 'ue': return '📋';
      case 'cours': return '📝';
      default: return '📄';
    }
  }
}
