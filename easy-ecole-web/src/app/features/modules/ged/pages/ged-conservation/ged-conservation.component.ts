import { Component, OnInit } from '@angular/core';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-conservation',
  templateUrl: './ged-conservation.component.html',
  styleUrls: ['./ged-conservation.component.scss']
})
export class GedConservationComponent implements OnInit {
  documents: GedDocument[] = [];
  loading = false;
  filter: 'all' | 'dua_approaching' | 'dua_expired' | 'a_detruire' | 'archived' = 'all';
  search = '';
  selectedDomainId: number | null = null;
  selectedDocumentTypeId: number | null = null;
  domains: any[] = [];
  documentTypes: any[] = [];
  selectedIds: Set<string> = new Set();
  duaThreshold: number = 90;

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.loadDomains();
    this.loadDocumentTypes();
    this.load();
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
    const params: any = { pageSize: 100 };

    if (this.filter === 'dua_approaching') {
      params.duaApproaching = 'true';
    } else if (this.filter === 'dua_expired') {
      params.duaExpired = 'true';
    } else if (this.filter === 'a_detruire') {
      params.lifecycleStatus = 'a_detruire';
    } else if (this.filter === 'archived') {
      params.lifecycleStatus = 'definitif';
    }

    if (this.search) params.q = this.search;
    if (this.selectedDomainId) params.domainId = this.selectedDomainId;
    if (this.selectedDocumentTypeId) params.documentTypeId = this.selectedDocumentTypeId;

    this.gedService.getAllPaginated(params).subscribe({
      next: (res) => {
        this.documents = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setFilter(f: any) {
    this.filter = f;
    this.load();
  }

  onFilterChange() {
    this.load();
  }

  toggleSelect(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedIds.clear();
    } else {
      this.documents.forEach(d => this.selectedIds.add(d.id));
    }
  }

  get allSelected(): boolean {
    return this.documents.length > 0 && this.documents.every(d => this.selectedIds.has(d.id));
  }

  setThreshold(days: number) {
    this.duaThreshold = days;
    this.load();
  }

  get totalCount(): number {
    return this.documents.length;
  }

  get approachingCount(): number {
    return this.documents.filter(d => this.isApproaching(d)).length;
  }

  get expiredCount(): number {
    return this.documents.filter(d => this.isExpired(d)).length;
  }

  get aDetruireCount(): number {
    return this.documents.filter(d => d.lifecycleStatus === 'a_detruire').length;
  }

  get archivedCount(): number {
    return this.documents.filter(d => d.lifecycleStatus === 'definitif').length;
  }

  get statsByDomain(): { label: string; total: number; approaching: number; expired: number }[] {
    const map = new Map<string, { label: string; total: number; approaching: number; expired: number }>();
    this.documents.forEach(d => {
      const label = this.getDomainLabel(d);
      if (!map.has(label)) map.set(label, { label, total: 0, approaching: 0, expired: 0 });
      const entry = map.get(label)!;
      entry.total++;
      if (this.isApproaching(d)) entry.approaching++;
      if (this.isExpired(d)) entry.expired++;
    });
    return Array.from(map.values());
  }

  private isApproaching(doc: GedDocument): boolean {
    if (!doc.duaEndDate) return false;
    const dua = new Date(doc.duaEndDate);
    const now = new Date();
    const diff = (dua.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= this.duaThreshold;
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

  getLifecycleBadge(status?: string): string {
    const map: Record<string, string> = {
      'courant': 'bg-gray-200 text-gray-700',
      'intermediaire': 'bg-blue-100 text-blue-700',
      'definitif': 'bg-emerald-100 text-emerald-700',
      'a_detruire': 'bg-red-100 text-red-700'
    };
    return map[status || ''] || 'bg-gray-100 text-gray-600';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getDomainLabel(doc: GedDocument): string {
    return doc.domain?.label || '-';
  }

  prolongerDUA(doc: GedDocument) {
    const years = prompt(`Prolonger la DUA de "${doc.titre}" de combien d'années ?`, '5');
    if (years && !isNaN(Number(years))) {
      const currentEnd = doc.duaEndDate ? new Date(doc.duaEndDate) : new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setFullYear(newEnd.getFullYear() + Number(years));
      const formData = new FormData();
      formData.append('duaEndDate', newEnd.toISOString().slice(0, 10));
      this.gedService.update(doc.id, formData).subscribe({
        next: () => {
          doc.duaEndDate = newEnd.toISOString().slice(0, 10);
        }
      });
    }
  }

  archiverDefinitif(doc: GedDocument) {
    if (!confirm(`Archiver définitivement "${doc.titre}" ?`)) return;
    const formData = new FormData();
    formData.append('lifecycleStatus', 'definitif');
    formData.append('isArchived', 'true');
    this.gedService.update(doc.id, formData).subscribe({
      next: () => {
        doc.lifecycleStatus = 'definitif';
        this.selectedIds.delete(doc.id);
      }
    });
  }

  archiverSelectionnes() {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Archiver définitivement les ${this.selectedIds.size} document(s) sélectionné(s) ?`)) return;
    this.selectedIds.forEach(id => {
      const doc = this.documents.find(d => d.id === id);
      if (doc) this.archiverDefinitif(doc);
    });
  }

  download(doc: GedDocument) {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }

  navigateToDocument(doc: GedDocument) {
    window.open(`/ged/document/${doc.id}`, '_blank');
  }

  exportCSV() {
    const headers = ['Référence', 'Titre', 'Type', 'Domaine', 'DUA Fin', 'Statut DUA', 'Cycle de vie'];
    const rows = this.documents.map(d => [
      d.reference || '',
      d.titre,
      d.documentType?.label || '',
      this.getDomainLabel(d),
      this.formatDate(d.duaEndDate),
      this.getDuaStatusLabel(this.getDuaStatus(d)),
      d.lifecycleStatus || ''
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conservation-dua-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
