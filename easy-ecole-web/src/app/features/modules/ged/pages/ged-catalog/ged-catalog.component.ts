import { Component, OnInit } from '@angular/core';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-catalog',
  templateUrl: './ged-catalog.component.html',
  styleUrls: ['./ged-catalog.component.scss']
})
export class GedCatalogComponent implements OnInit {
  documents: GedDocument[] = [];
  loading = false;
  search = '';
  folders: any[] = [];
  selectedFolderId?: number;
  selectedStatut = '';
  private searchTimeout: any;

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.load();
    this.gedService.getFolders().subscribe({ next: f => this.folders = f });
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.selectedFolderId) params.folderId = this.selectedFolderId;
    if (this.selectedStatut) params.statut = this.selectedStatut;
    if (this.search) params.q = this.search;

    this.gedService.getAll(params).subscribe({
      next: (res) => { this.documents = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 400);
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

  get filteredDocuments(): GedDocument[] {
    return this.documents;
  }

  get archivedCount(): number {
    return this.documents.filter(d => d.statut === 'archive').length;
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
