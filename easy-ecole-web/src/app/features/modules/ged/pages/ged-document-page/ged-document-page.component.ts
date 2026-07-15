import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-document-page',
  templateUrl: './ged-document-page.component.html',
  styleUrls: ['./ged-document-page.component.scss']
})
export class GedDocumentPageComponent implements OnInit {
  doc?: GedDocument;
  loading = false;
  previewUrl?: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gedService: GedService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string) {
    this.loading = true;
    this.gedService.get(id).subscribe({
      next: (doc) => {
        this.doc = doc;
        this.loading = false;
        this.loadPreview();
      },
      error: () => this.loading = false
    });
  }

  private loadPreview() {
    if (!this.doc) return;
    const url = this.gedService.getDownloadUrl(this.doc.id);
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  download() {
    if (!this.doc) return;
    window.open(this.gedService.getDownloadUrl(this.doc.id), '_blank');
  }

  exportPdf() {
    if (!this.doc) return;
    this.gedService.generatePdf(this.doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.doc!.titre.replace(/\s+/g, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  deleteDoc() {
    if (!this.doc || !confirm(`Supprimer "${this.doc.titre}" ?`)) return;
    this.gedService.delete(this.doc.id).subscribe({
      next: () => this.router.navigate(['/ged/catalog'])
    });
  }

  getTags(doc: GedDocument): string[] {
    return (doc.tags || '').split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
}
