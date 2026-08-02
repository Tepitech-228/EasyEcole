import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

interface HierarchyNode {
  id: string;
  type: 'annee' | 'niveau' | 'parcours';
  label: string;
  data: { id: number; dossiers: number; demandes: number; bordereaux: number };
  children?: HierarchyNode[];
  expanded?: boolean;
  loading?: boolean;
}

interface HierarchyDossier {
  id: number;
  matricule?: string;
  statut?: string;
  dateCreation?: string;
  utilisateur?: {
    nom?: string;
    prenoms?: string;
    email?: string;
    apprenant?: { photo?: string };
  };
}

interface HierarchyDetails {
  dossiers?: HierarchyDossier[];
  demandes?: unknown[];
  bordereaux?: unknown[];
}

@Component({
  selector: 'app-hierarchy-dossiers-page',
  templateUrl: './hierarchy-dossiers-page.component.html',
  styleUrls: ['./hierarchy-dossiers-page.component.scss']
})
export class HierarchyDossiersPageComponent extends BaseComponentClass implements OnInit {

  tree: HierarchyNode[] = [];
  treeLoading = false;
  selectedNode: HierarchyNode | null = null;
  detailLoading = false;
  detailDossiers: HierarchyDossier[] = [];

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS;

  constructor(private http: HttpClient) {
    super();
  }

  ngOnInit(): void {
    this.loadTree();
  }

  private loadTree(): void {
    this.treeLoading = true;
    this.http.get<HierarchyNode[]>(`${environment.API_MODULES.INSCRIPTION}/hierarchy`).subscribe({
      next: (data) => {
        this.tree = (data || []).map(node => ({ ...node, expanded: false, loading: false }));
        this.treeLoading = false;
      },
      error: () => { this.treeLoading = false; }
    });
  }

  toggle(node: HierarchyNode): void {
    if (node.children?.length) {
      node.expanded = !node.expanded;
    }
  }

  select(node: HierarchyNode): void {
    this.selectedNode = node;
    this.detailLoading = true;
    this.detailDossiers = [];
    this.http.get<HierarchyDetails>(
      `${environment.API_MODULES.INSCRIPTION}/hierarchy/${node.type}/${node.data.id}/${this.getAnneeId(node)}`
    ).subscribe({
      next: (res) => {
        this.detailDossiers = res?.dossiers || [];
        this.detailLoading = false;
      },
      error: () => { this.detailLoading = false; }
    });
  }

  get counts(): { dossiers: number; demandes: number; bordereaux: number } {
    return {
      dossiers: this.selectedNode?.data.dossiers ?? 0,
      demandes: this.selectedNode?.data.demandes ?? 0,
      bordereaux: this.selectedNode?.data.bordereaux ?? 0
    };
  }

  getNodeTypeLabel(type: string): string {
    switch (type) {
      case 'annee': return 'Année académique';
      case 'niveau': return 'Niveau';
      case 'parcours': return 'Parcours';
      default: return '';
    }
  }

  getDossierStatutColor(statut?: string): string {
    switch (statut) {
      case 'actif': return 'green';
      case 'suspendu': return 'yellow';
      case 'archive': return 'red';
      default: return 'gray';
    }
  }

  getPhotoUrl(dossier: HierarchyDossier): string {
    if (dossier.utilisateur?.apprenant?.photo) {
      return this.PHOTOS_PATH + dossier.utilisateur.apprenant.photo;
    }
    return 'assets/images/blank-profile-picture.png';
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private getAnneeId(node: HierarchyNode): number {
    let current: HierarchyNode | undefined = node;
    while (current && current.type !== 'annee') {
      current = this.findParent(current);
    }
    return current?.data.id || 0;
  }

  private findParent(node: HierarchyNode): HierarchyNode | undefined {
    for (const parent of this.tree) {
      if (parent.children?.some(c => c.id === node.id)) return parent;
      if (parent.children) {
        for (const child of parent.children) {
          if (child.children?.some(c => c.id === node.id)) return child;
        }
      }
    }
    return undefined;
  }
}
