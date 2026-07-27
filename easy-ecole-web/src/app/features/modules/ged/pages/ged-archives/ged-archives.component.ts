import { Component, OnInit } from '@angular/core';
import { GedService, GedDocument, GedDomain, GedDocumentType } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-archives',
  templateUrl: './ged-archives.component.html',
  styleUrls: ['./ged-archives.component.scss']
})
export class GedArchivesComponent implements OnInit {
  documents: GedDocument[] = [];
  loading = false;
  search = '';
  selectedDomainId: number | null = null;
  selectedDocumentTypeId: number | null = null;
  selectedSourceType = '';
  domains: GedDomain[] = [];
  documentTypes: GedDocumentType[] = [];
  currentPage = 1;
  pageSize = 25;
  total = 0;

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.loadDomains();
    this.loadDocumentTypes();
    this.load();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize) || 1;
  }

  loadDomains() {
    this.gedService.getDomains().subscribe({
      next: (domains) => { this.domains = domains; }
    });
  }

  loadDocumentTypes() {
    this.gedService.getDocumentTypes().subscribe({
      next: (types) => { this.documentTypes = types; }
    });
  }

  load() {
    this.loading = true;
    this.gedService.getAllPaginated(this.buildFilterParams()).subscribe({
      next: (res) => {
        this.documents = res.data;
        this.total = res.total;
        this.currentPage = res.page;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  buildFilterParams() {
    const params: any = {
      page: this.currentPage,
      pageSize: this.pageSize,
      lifecycleStatus: 'definitif'
    };
    if (this.search) params.q = this.search;
    if (this.selectedDomainId) params.domainId = this.selectedDomainId;
    if (this.selectedDocumentTypeId) params.documentTypeId = this.selectedDocumentTypeId;
    if (this.selectedSourceType) params.sourceType = this.selectedSourceType;
    return params;
  }

  onFilterChange() {
    this.currentPage = 1;
    this.load();
  }

  pageChanged(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.load();
  }

  get tailleTotale(): string {
    const totalKo = this.documents.reduce((s, d) => {
      const v = parseFloat((d.taille || '0').replace(/,/, '.').replace(/[^0-9.]/g, ''));
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    if (totalKo > 1048576) return (totalKo / 1048576).toFixed(1) + ' Go';
    if (totalKo > 1024) return (totalKo / 1024).toFixed(1) + ' Mo';
    return totalKo.toFixed(0) + ' Ko';
  }

  getStatsByDomain(): { label: string; count: number }[] {
    const map = new Map<string, number>();
    for (const d of this.documents) {
      const label = d.domain?.label || 'Non classé';
      map.set(label, (map.get(label) || 0) + 1);
    }
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }

  download(doc: GedDocument) {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }

  restaurer(doc: GedDocument) {
    const fd = new FormData();
    fd.append('statut', 'Disponible');
    fd.append('isArchived', 'false');
    this.gedService.update(doc.id, fd).subscribe({ next: () => this.load() });
  }

  private isApproaching(doc: GedDocument): boolean {
    if (!doc.duaEndDate) return false;
    const dua = new Date(doc.duaEndDate);
    const now = new Date();
    const diff = (dua.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  }

  private isExpired(doc: GedDocument): boolean {
    if (!doc.duaEndDate) return false;
    return new Date(doc.duaEndDate) < new Date();
  }

  getDuaStatus(doc: GedDocument): 'expired' | 'approaching' | 'ok' | 'none' {
    if (!doc.duaEndDate) return 'none';
    if (this.isExpired(doc)) return 'expired';
    if (this.isApproaching(doc)) return 'approaching';
    return 'ok';
  }

  getDuaStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'expired': 'DUA expirée',
      'approaching': 'DUA proche',
      'ok': 'DUA valide',
      'none': 'Pas de DUA'
    };
    return map[status] || status;
  }

  getDuaBadge(status: string): string {
    const map: Record<string, string> = {
      'expired': 'bg-red-100 text-red-700',
      'approaching': 'bg-orange-100 text-orange-700',
      'ok': 'bg-emerald-100 text-emerald-700',
      'none': 'bg-gray-100 text-gray-600'
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }
}
