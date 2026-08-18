import { Component, OnInit } from '@angular/core';
import { GedService, GedDocument, PaginatedResponse } from 'src/app/data/modules/ged/services/ged.service';

interface GedTreeNode {
  id: string;
  label: string;
  type: string;
  domainId?: number;
  anneeId?: number;
  niveauId?: number;
  parcoursId?: number;
  classeId?: number;
  folderId?: number;
  sourceType?: string;
  data?: { docCount: number };
  children: GedTreeNode[];
  leaf?: boolean;
  expanded?: boolean;
  loading?: boolean;
}

@Component({
  selector: 'app-ged-folders',
  templateUrl: './ged-folders.component.html',
  styleUrls: ['./ged-folders.component.scss']
})
export class GedFoldersComponent implements OnInit {
  tree: GedTreeNode[] = [];
  treeLoading = false;
  treeLoadingFailed = false;

  documents: GedDocument[] = [];
  documentsLoading = false;
  selectedNode: GedTreeNode | null = null;

  search = '';
  private treeCache: GedTreeNode[] = [];

  page = 1;
  pageSize = 20;
  total = 0;
  totalPages = 0;

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.treeLoading = true;
    this.treeLoadingFailed = false;
    this.gedService.getDomainTree().subscribe({
      next: (tree: any[]) => {
        this.treeCache = (tree || []).map((n: any) => ({
          ...n,
          children: n.children || [],
          expanded: true
        }));
        this.applyTreeFilter();
        this.treeLoading = false;
      },
      error: () => {
        this.treeLoading = false;
        this.treeLoadingFailed = true;
      }
    });
  }

  applyTreeFilter(): void {
    const query = this.search.trim().toLowerCase();
    this.tree = query ? this.filterTree(this.treeCache, query) : this.treeCache;
  }

  private filterTree(nodes: GedTreeNode[], query: string): GedTreeNode[] {
    const result: GedTreeNode[] = [];
    for (const node of nodes) {
      const matches = node.label.toLowerCase().includes(query);
      const children = this.filterTree(node.children || [], query);
      if (matches || children.length > 0) {
        result.push({ ...node, children, expanded: true });
      }
    }
    return result;
  }

  onSearch(): void {
    this.applyTreeFilter();
  }

  hasChildren(node: GedTreeNode): boolean {
    return !node.leaf && !!node.children && node.children.length > 0;
  }

  toggleNode(node: GedTreeNode): void {
    node.expanded = !node.expanded;
    if (node.expanded && node.type === 'folder' && node.folderId != null && node.children.length === 0) {
      this.loadFolderChildren(node);
    }
  }

  private loadFolderChildren(node: GedTreeNode): void {
    if (node.loading) return;
    node.loading = true;
    this.gedService.getFolderChildren(node.folderId, node.domainId).subscribe({
      next: (children: any[]) => {
        node.children = (children || []).map((c: any) => ({
          id: `folder-${c.id}`,
          label: c.nom || `Dossier #${c.id}`,
          type: 'folder',
          folderId: c.id,
          domainId: c.domainId,
          data: { docCount: 0 },
          children: [],
          leaf: true,
          expanded: false
        }));
        node.loading = false;
        node.children.forEach((child) => this.refreshFolderCount(child));
        this.applyTreeFilter();
      },
      error: () => {
        node.loading = false;
        node.children = [];
      }
    });
  }

  private refreshFolderCount(node: GedTreeNode): void {
    if (node.folderId == null) return;
    this.gedService.getAllPaginated({ folderId: node.folderId, pageSize: 1 }).subscribe({
      next: (res: PaginatedResponse) => {
        node.data = { docCount: res.total || 0 };
      },
      error: () => {}
    });
  }

  selectNode(node: GedTreeNode): void {
    this.selectedNode = node;
    this.page = 1;
    this.loadDocuments();
  }

  resetSelection(): void {
    this.selectedNode = null;
    this.page = 1;
    this.loadDocuments();
  }

  private buildFilters(): any {
    if (!this.selectedNode) return {};
    const node = this.selectedNode;
    const params: any = {};
    if (node.folderId != null) {
      params.folderId = node.folderId;
    }
    if (node.domainId) params.domainId = node.domainId;
    if (node.anneeId) params.anneeAcademiqueId = node.anneeId;
    if (node.niveauId) params.niveauEtudeId = node.niveauId;
    if (node.parcoursId) params.parcoursId = node.parcoursId;
    if (node.classeId) params.classeId = node.classeId;
    if (node.sourceType) params.sourceType = node.sourceType;
    return params;
  }

  loadDocuments(): void {
    this.documentsLoading = true;
    this.gedService.getAllPaginated({
      page: this.page,
      pageSize: this.pageSize,
      ...this.buildFilters()
    }).subscribe({
      next: (res: PaginatedResponse) => {
        this.documents = res.data;
        this.total = res.total;
        this.totalPages = Math.ceil(this.total / this.pageSize) || 1;
        this.documentsLoading = false;
      },
      error: () => {
        this.documents = [];
        this.total = 0;
        this.totalPages = 1;
        this.documentsLoading = false;
      }
    });
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadDocuments();
  }

  get pages(): number[] {
    const p: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) p.push(i);
    return p;
  }

  expandAll(nodes: GedTreeNode[] = this.tree): void {
    for (const node of nodes) {
      node.expanded = true;
      if (node.type === 'folder' && node.folderId != null && node.children.length === 0) {
        this.loadFolderChildren(node);
      }
      this.expandAll(node.children || []);
    }
  }

  collapseAll(nodes: GedTreeNode[] = this.tree): void {
    for (const node of nodes) {
      node.expanded = false;
      this.collapseAll(node.children || []);
    }
  }

  getNodeIcon(node: GedTreeNode): string {
    const icons: Record<string, string> = {
      'domain': 'M3 7v6a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7',
      'annee': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
      'niveau': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      'parcours': 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4',
      'classe': 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4',
      'folder': 'M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z',
      'departement': 'M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
      'employe': 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z',
      'fournisseur': 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5',
      'courrier_entrant': 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      'courrier_sortant': 'M13 7l5 5m0 0l-5 5m5-5H6'
    };
    return icons[node.type] || icons['folder'];
  }

  getTypeLabel(doc: GedDocument): string {
    return doc.documentType?.shortCode || doc.type || '-';
  }

  getConfidentialityBadge(level?: string): string {
    const map: Record<string, string> = {
      'public': 'bg-emerald-100 text-emerald-700',
      'interne': 'bg-blue-100 text-blue-700',
      'restreint': 'bg-orange-100 text-orange-700',
      'confidentiel': 'bg-red-100 text-red-700'
    };
    return map[level || ''] || 'bg-gray-100 text-gray-600';
  }

  getConfidentialityLabel(level?: string): string {
    const map: Record<string, string> = {
      'public': 'Public',
      'interne': 'Interne',
      'restreint': 'Restreint',
      'confidentiel': 'Confidentiel'
    };
    return map[level || ''] || level || '-';
  }

  formatDate(value?: string | Date): string {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
  }

  download(doc: GedDocument): void {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }
}
