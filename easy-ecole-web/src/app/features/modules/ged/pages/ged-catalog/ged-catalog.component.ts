import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GedService, GedDocument, GedDomain, GedSession, PaginatedResponse, ProcessusGenerateur } from 'src/app/data/modules/ged/services/ged.service';
import { forkJoin } from 'rxjs';

interface TreeNode {
  id: string;
  label: string;
  type: string;
  domainId?: number;
  anneeId?: number;
  niveauId?: number;
  parcoursId?: number;
  classeId?: number;
  folderId?: number;
  data?: { docCount: number };
  children: TreeNode[];
  leaf?: boolean;
  expanded?: boolean;
  loading?: boolean;
}

@Component({
  selector: 'app-ged-catalog',
  templateUrl: './ged-catalog.component.html',
  styleUrls: ['./ged-catalog.component.scss']
})
export class GedCatalogComponent implements OnInit {
  documents: GedDocument[] = [];
  loading = false;
  search = '';
  selectedDomainId: number | null = null;
  selectedConfidentiality = '';
  selectedLifecycle = '';
  selectedProcessusGenerateurId: string | null = null;
  selectedFolderId: number | null = null;
  selectedSessionId: string | null = null;
  processusGenerateurs: ProcessusGenerateur[] = [];
  sessions: GedSession[] = [];
  domains: GedDomain[] = [];
  treeLoadingFailed = false;
  page = 1;
  pageSize = 15;
  total = 0;
  totalPages = 0;

  tree: TreeNode[] = [];
  selectedNode: TreeNode | null = null;
  filterParams: any = {};

  private searchTimeout: any;

  constructor(
    private gedService: GedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTree();
    this.loadDomains();
    this.loadProcessus();
    this.loadSessions();
    this.load();
  }

  loadDomains() {
    this.gedService.getDomains().subscribe({
      next: (list) => { this.domains = list; }
    });
  }

  loadSessions() {
    this.gedService.getSessions().subscribe({
      next: (list) => { this.sessions = list; }
    });
  }

  loadProcessus() {
    this.gedService.getProcessusGenerateurs().subscribe({
      next: (list) => { this.processusGenerateurs = list; }
    });
  }

  loadTree() {
    this.gedService.getDomainTree().subscribe({
      next: (tree) => {
        this.tree = tree;
        this.treeLoadingFailed = false;
        this.loading = false;
      },
      error: () => {
        this.treeLoadingFailed = true;
        this.loading = false;
      }
    });
  }

  selectDomain(domain: GedDomain) {
    this.selectedDomainId = domain.id;
    this.filterParams = {};
    this.selectedNode = { id: `domain-${domain.id}`, label: domain.label, type: 'domain', domainId: domain.id, children: [] };
    this.page = 1;
    this.load();
  }

  filterByDomain(domainId: number | null) {
    this.selectedDomainId = domainId;
    this.filterParams = {};
    this.selectedNode = domainId ? { id: `domain-${domainId}`, label: '', type: 'domain', domainId, children: [] } : null;
    this.page = 1;
    this.load();
  }

  toggleNode(node: TreeNode) {
    if (this.selectedNode === node) {
      this.selectedNode = null;
      this.selectedDomainId = null;
      this.load();
      return;
    }

    if (node.type === 'domain') {
      this.selectedDomainId = node.domainId || null;
    } else {
      this.selectedDomainId = node.domainId || null;
    }

    node.expanded = !node.expanded;
    this.selectedNode = node;
    this.page = 1;
    this.load();
  }

  selectLeaf(node: any) {
    this.selectedNode = node;
    this.selectedFolderId = null;
    this.buildFilterFromNode(node);
    this.load();
  }

  private buildFilterFromNode(node: any) {
    this.filterParams = {};

    if (node.domainId) this.filterParams.domainId = node.domainId;
    if (node.anneeId) this.filterParams.anneeAcademiqueId = node.anneeId;
    if (node.niveauId) this.filterParams.niveauEtudeId = node.niveauId;
    if (node.parcoursId) this.filterParams.parcoursId = node.parcoursId;
    if (node.classeId) this.filterParams.classeId = node.classeId;
    if (node.folderId) this.filterParams.folderId = node.folderId;
    if (node.departementId) this.filterParams['departementId'] = node.departementId;
    if (node.employeId) this.filterParams['employeId'] = node.employeId;
    if (node.fournisseurId) this.filterParams['fournisseurId'] = node.fournisseurId;
    if (node.sourceType) this.filterParams.sourceType = node.sourceType;
  }

  resetFilters() {
    this.selectedNode = null;
    this.selectedDomainId = null;
    this.filterParams = {};
    this.page = 1;
    this.load();
  }

  buildFilterParams(): any {
    const params: any = {};

    // Existing node-based filters
    if (this.selectedNode) {
      if (this.selectedNode.domainId) params.domainId = this.selectedNode.domainId;
      if (this.selectedNode.anneeId) params.anneeAcademiqueId = this.selectedNode.anneeId;
      if (this.selectedNode.niveauId) params.niveauEtudeId = this.selectedNode.niveauId;
      if (this.selectedNode.parcoursId) params.parcoursId = this.selectedNode.parcoursId;
      if (this.selectedNode.classeId) params.classeId = this.selectedNode.classeId;
      if (this.selectedNode.folderId) params.folderId = this.selectedNode.folderId;
    }

    // Merge additional filters from filterParams
    if (this.filterParams.sourceType) params.sourceType = this.filterParams.sourceType;

    // Existing search and option filters
    if (this.search) params.q = this.search;
    if (this.selectedConfidentiality) params.confidentialityLevel = this.selectedConfidentiality;
    if (this.selectedProcessusGenerateurId) params.processusGenerateurId = this.selectedProcessusGenerateurId;
    if (this.selectedSessionId) params.sessionId = this.selectedSessionId;
    if (this.selectedLifecycle) params.lifecycleStatus = this.selectedLifecycle;

    return params;
  }

  load() {
    this.loading = true;
    const filterParams = this.buildFilterParams();

    this.gedService.getAllPaginated({
      page: this.page,
      pageSize: this.pageSize,
      q: this.search || undefined,
      ...filterParams,
      processusGenerateurId: this.selectedProcessusGenerateurId || undefined,
      confidentialityLevel: this.selectedConfidentiality || undefined,
      lifecycleStatus: this.selectedLifecycle || undefined
    }).subscribe({
      next: (res: PaginatedResponse) => {
        this.documents = res.data;
        this.total = res.total;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.load();
    }, 400);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  get pages(): number[] {
    const p: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) p.push(i);
    return p;
  }

  getNodeIcon(node: any): string {
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
      'courrier_sortant': 'M13 7l5 5m0 0l-5 5m5-5H6',
    };
    return icons[node.type] || icons['folder'];
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

  getLifecycleBadge(status?: string): string {
    const map: Record<string, string> = {
      'courant': 'bg-gray-200 text-gray-700',
      'intermediaire': 'bg-blue-100 text-blue-700',
      'definitif': 'bg-emerald-100 text-emerald-700',
      'a_detruire': 'bg-red-100 text-red-700'
    };
    return map[status || ''] || 'bg-gray-100 text-gray-600';
  }

  getLifecycleLabel(status?: string): string {
    const map: Record<string, string> = {
      'courant': 'Courant',
      'intermediaire': 'Intermédiaire',
      'definitif': 'Définitif',
      'a_detruire': 'À détruire'
    };
    return map[status || ''] || status || '-';
  }

  getSizeLabel(taille?: string): string {
    if (!taille) return '-';
    return taille;
  }

  getVersionLabel(doc: GedDocument): string {
    if (doc.versionMajor == null) return '-';
    return `v${doc.versionMajor}.${doc.versionMinor ?? 0}`;
  }

  getTypeLabel(doc: GedDocument): string {
    return doc.documentType?.shortCode || doc.type || '-';
  }

  getDomainLabel(doc: GedDocument): string {
    return doc.domain?.label || '-';
  }

  formatTaille(taille?: string): string {
    if (!taille) return '-';
    return taille;
  }

  download(doc: GedDocument) {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }

  exportPdf(doc: GedDocument) {
    this.gedService.generatePdf(doc.id).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `${doc.titre.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  deleteDoc(doc: GedDocument) {
    if (!confirm(`Supprimer "${doc.titre}" ?`)) return;
    this.gedService.delete(doc.id).subscribe({ next: () => this.load() });
  }

  navigateToDocument(doc: GedDocument) {
    this.router.navigate(['/ged/document', doc.id]);
  }

  get archivedCount(): number {
    return this.documents.filter(d => d.statut === 'archive' || d.lifecycleStatus === 'a_detruire').length;
  }

  getNbPages(): number {
    return this.documents.reduce((s, d) => s + (d.nbPages || 0), 0);
  }

  getTailleTotale(): string {
    const totalKo = this.documents.reduce((s, d) => {
      const v = parseFloat((d.taille || '0').replace(/,/, '.').replace(/[^0-9.]/g, ''));
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    if (totalKo > 1024 * 1024) return (totalKo / 1024 / 1024).toFixed(1) + ' Go';
    if (totalKo > 1024) return (totalKo / 1024).toFixed(1) + ' Mo';
    return totalKo.toFixed(0) + ' Ko';
  }
}
