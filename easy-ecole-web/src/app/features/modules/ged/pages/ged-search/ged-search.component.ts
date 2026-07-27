import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GedService, GedDocument, GedDomain, GedDocumentType, PaginatedResponse, ProcessusGenerateur } from 'src/app/data/modules/ged/services/ged.service';
import { HttpClient } from '@angular/common/http';

interface DomainNode {
  domain: GedDomain;
  expanded: boolean;
  loading: boolean;
  folders: any[];
}

@Component({
  selector: 'app-ged-search',
  templateUrl: './ged-search.component.html',
  styleUrls: ['./ged-search.component.scss']
})
export class GedSearchComponent implements OnInit {
  documents: GedDocument[] = [];
  loading = false;
  search = '';
  page = 1;
  pageSize = 15;
  total = 0;
  totalPages = 0;

  domains: GedDomain[] = [];
  domainNodes: DomainNode[] = [];
  documentTypes: GedDocumentType[] = [];

  selectedDomainId: number | null = null;
  selectedDocumentTypeId: number | null = null;
  selectedFolderId: number | null = null;
  selectedConfidentiality = '';
  selectedLifecycle = '';
  selectedSort = 'createdAt_desc';
  selectedSemestre = '';
  selectedClasseId: number | null = null;
  selectedSourceType = '';
  selectedModeEnvoi = '';
  selectedProcessusGenerateurId: string | null = null;
  selectedStorageLocation = '';
  dateCreationFrom = '';
  dateCreationTo = '';

  processusGenerateurs: ProcessusGenerateur[] = [];

  anneeAcademiqueId: number | null = null;
  parcoursId: number | null = null;
  niveauEtudeId: number | null = null;

  folderIdFilter: number | null = null;

  viewMode: 'table' | 'grid' = 'table';

  private searchTimeout: any;

  constructor(
    private gedService: GedService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDomains();
    this.loadDocumentTypes();
    this.loadProcessus();
    this.load();
  }

  loadProcessus() {
    this.gedService.getProcessusGenerateurs().subscribe({
      next: (list) => { this.processusGenerateurs = list; }
    });
  }

  loadDomains() {
    this.gedService.getDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.domainNodes = domains.map(d => ({
          domain: d,
          expanded: false,
          loading: false,
          folders: []
        }));
      }
    });
  }

  loadDocumentTypes() {
    this.gedService.getDocumentTypes().subscribe({
      next: (types) => { this.documentTypes = types; },
      error: () => {}
    });
  }

  toggleDomain(node: DomainNode) {
    if (this.selectedDomainId === node.domain.id) {
      this.selectedDomainId = null;
      node.expanded = false;
    } else {
      this.selectedDomainId = node.domain.id;
      this.domainNodes.forEach(n => { if (n !== node) n.expanded = false; });
      node.expanded = true;
      if (node.folders.length === 0 && !node.loading) {
        this.loadDomainFolders(node);
      }
    }
    this.folderIdFilter = null;
    this.page = 1;
    this.load();
  }

  loadDomainFolders(node: DomainNode) {
    node.loading = true;
    this.gedService.getFolderChildren(undefined, node.domain.id).subscribe({
      next: (folders) => {
        node.folders = folders;
        node.loading = false;
      },
      error: () => node.loading = false
    });
  }

  toggleFolder(node: DomainNode, folder: any) {
    if (this.folderIdFilter === folder.id) {
      this.folderIdFilter = null;
    } else {
      this.folderIdFilter = folder.id;
      if (!folder._children && !folder._loading) {
        this.loadFolderChildren(folder);
      }
    }
    this.page = 1;
    this.load();
  }

  loadFolderChildren(folder: any) {
    folder._loading = true;
    this.gedService.getFolderChildren(folder.id).subscribe({
      next: (children) => {
        folder._children = children;
        folder._loading = false;
      },
      error: () => folder._loading = false
    });
  }

  load() {
    this.loading = true;
    const params: any = {
      page: this.page,
      pageSize: this.pageSize,
      q: this.search || undefined,
      domainId: this.selectedDomainId || undefined,
      documentTypeId: this.selectedDocumentTypeId || undefined,
      confidentialityLevel: this.selectedConfidentiality || undefined,
      lifecycleStatus: this.selectedLifecycle || undefined,
      folderId: this.folderIdFilter || undefined,
      semestre: this.selectedSemestre || undefined,
      classeId: this.selectedClasseId || undefined,
      sourceType: this.selectedSourceType || undefined,
      processusGenerateurId: this.selectedProcessusGenerateurId || undefined,
      storageLocation: this.selectedStorageLocation || undefined,
      modeEnvoi: this.selectedModeEnvoi || undefined,
      anneeAcademiqueId: this.anneeAcademiqueId || undefined,
      parcoursId: this.parcoursId || undefined,
      niveauEtudeId: this.niveauEtudeId || undefined,
      dateCreationFrom: this.dateCreationFrom || undefined,
      dateCreationTo: this.dateCreationTo || undefined
    };

    if (this.selectedSort) {
      const [field, direction] = this.selectedSort.split('_');
      params.sortField = field;
      params.sortDirection = direction;
    }

    this.gedService.getAllPaginated(params).subscribe({
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

  onFilterChange() {
    this.page = 1;
    this.load();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  resetFilters() {
    this.selectedDomainId = null;
    this.selectedDocumentTypeId = null;
    this.folderIdFilter = null;
    this.selectedConfidentiality = '';
    this.selectedLifecycle = '';
    this.selectedSort = 'createdAt_desc';
    this.selectedSemestre = '';
    this.selectedClasseId = null;
    this.selectedSourceType = '';
    this.selectedModeEnvoi = '';
    this.selectedProcessusGenerateurId = null;
    this.selectedStorageLocation = '';
    this.anneeAcademiqueId = null;
    this.parcoursId = null;
    this.niveauEtudeId = null;
    this.dateCreationFrom = '';
    this.dateCreationTo = '';
    this.search = '';
    this.page = 1;
    this.domainNodes.forEach(n => n.expanded = false);
    this.load();
  }

  get pages(): number[] {
    const p: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) p.push(i);
    return p;
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

  formatTaille(taille?: string): string {
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

  getSemestreLabel(semestre?: string): string {
    const map: Record<string, string> = {
      'semestre1': 'S1', 'semestre2': 'S2', 'semestre3': 'S3',
      'semestre4': 'S4', 'semestre5': 'S5', 'semestre6': 'S6'
    };
    return map[semestre || ''] || semestre || '-';
  }

  getSourceLabel(source?: string): string {
    const map: Record<string, string> = {
      'genere_application': 'Généré (App)',
      'numerise_interne': 'Numérisé (Interne)',
      'recu_externe': 'Reçu (Externe)',
      'document_sortant': 'Document sortant'
    };
    return map[source || ''] || source || '-';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  download(doc: GedDocument) {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }

  exportPdf(doc: GedDocument) {
    this.gedService.generatePdf(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.titre.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  navigateToDocument(doc: GedDocument) {
    this.router.navigate(['/ged/document', doc.id]);
  }
}
