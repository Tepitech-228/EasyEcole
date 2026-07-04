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

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.load();
    this.loadFolders();
  }

  load() {
    this.loading = true;
    this.gedService.getAll().subscribe({
      next: (res) => { this.documents = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadFolders() {
    this.gedService.getFolders().subscribe({ next: f => this.folders = f });
  }

  download(doc: GedDocument) {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }

  exportPdf(doc: GedDocument) {
    this.loading = true;
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
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredDocuments(): GedDocument[] {
    const q = (this.search || '').toLowerCase();
    return this.documents.filter(d => {
      if (this.selectedFolderId && (d as any).folderId !== this.selectedFolderId) return false;
      if (!q) return true;
      return (d.titre || '').toLowerCase().includes(q) || (d.nommage || '').toLowerCase().includes(q) || (d.reference || '').toLowerCase().includes(q);
    });
  }
}
