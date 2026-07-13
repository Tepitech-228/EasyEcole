import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-document-page',
  templateUrl: './ged-document-page.component.html',
  styleUrls: ['./ged-document-page.component.scss']
})
export class GedDocumentPageComponent implements OnInit {
  doc?: GedDocument;
  loading = false;

  constructor(private route: ActivatedRoute, private gedService: GedService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string) {
    this.loading = true;
    this.gedService.getAll().subscribe({
      next: (docs) => { this.doc = docs.find(d => d.id === id); this.loading = false; },
      error: () => this.loading = false
    });
  }

  download() {
    if (!this.doc) return;
    window.open(this.gedService.getDownloadUrl(this.doc.id), '_blank');
  }

  exportPdf() {
    if (!this.doc) return;
    this.loading = true;
    this.gedService.generatePdf(this.doc.id).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `${this.doc?.titre.replace(/\s+/g, '_')}.pdf`;
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
}
