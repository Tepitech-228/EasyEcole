import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-saisie',
  templateUrl: './ged-saisie.component.html',
  styleUrls: ['./ged-saisie.component.scss']
})
export class GedSaisieComponent implements OnInit, OnDestroy {
  documents: GedDocument[] = [];
  currentIndex = 0;
  folders: any[] = [];

  titre = '';
  reference = '';
  eleve = '';
  parcours = '';
  categorie = '';
  tags = '';
  nommage = '';
  dureeConservation = '';
  archivedUntil?: string;
  isArchived = false;
  selectedFolderId?: number;

  pdfPreviewUrl?: SafeResourceUrl | null = null;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';

  private objectUrl?: string;

  constructor(
    private gedService: GedService,
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.gedService.getFolders().subscribe({ next: (f) => this.folders = f });
    this.loadPending();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private loadPending(): void {
    this.gedService.getAll().subscribe({
      next: (docs) => {
        this.documents = docs.filter(d => d.statut === 'en_attente');
        this.loading = false;
        if (this.documents.length > 0) {
          this.showDocument(0);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger les documents en attente.';
      }
    });
  }

  get current(): GedDocument | null {
    return this.documents[this.currentIndex] || null;
  }

  get total(): number { return this.documents.length; }
  get progress(): number { return this.total ? Math.round((this.currentIndex / this.total) * 100) : 0; }

  prev(): void {
    if (this.currentIndex > 0) {
      this.showDocument(this.currentIndex - 1);
    }
  }

  next(): void {
    if (this.currentIndex < this.documents.length - 1) {
      this.showDocument(this.currentIndex + 1);
    }
  }

  private showDocument(index: number): void {
    this.currentIndex = index;
    this.revokePreview();
    this.error = '';
    this.successMessage = '';
    this.saving = false;

    const doc = this.current;
    if (!doc) return;

    this.titre = doc.titre || '';
    this.reference = doc.reference || '';
    this.eleve = doc.eleve || '';
    this.parcours = doc.parcours || '';
    this.categorie = doc.categorie || '';
    this.tags = doc.tags || '';
    this.nommage = doc.nommage || '';
    this.dureeConservation = (doc as any).dureeConservation || '';
    this.archivedUntil = (doc as any).archivedUntil ? String((doc as any).archivedUntil) : undefined;
    this.isArchived = (doc as any).isArchived || false;
    this.selectedFolderId = doc.folderId;

    this.loadPreview(doc);
  }

  private loadPreview(doc: GedDocument): void {
    const url = this.gedService.getDownloadUrl(doc.id);
    this.objectUrl = url;
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  save(status?: string): void {
    const doc = this.current;
    if (!doc || this.saving) return;

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    const payload: any = {
      titre: this.titre,
      reference: this.reference,
      eleve: this.eleve,
      parcours: this.parcours,
      categorie: this.categorie,
      tags: this.tags,
      nommage: this.nommage,
      dureeConservation: this.dureeConservation,
      folderId: this.selectedFolderId || null
    };
    if (this.archivedUntil) payload.archivedUntil = this.archivedUntil;
    if (status) payload.statut = status;
    if (this.isArchived) payload.isArchived = true;

    const apiUrl = `${environment.API_MODULES.SCOLARITE}`.replace('/scolarite', '/ged/documents');
    this.http.put<GedDocument>(`${apiUrl}/${doc.id}`, payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.successMessage = status === 'archive' ? 'Document archivé' : 'Modifications enregistrées';
        Object.assign(doc, updated);
        if (status === 'archive') {
          this.documents.splice(this.currentIndex, 1);
          if (this.documents.length === 0) {
            this.currentIndex = 0;
            this.revokePreview();
            this.pdfPreviewUrl = null;
          } else if (this.currentIndex >= this.documents.length) {
            this.showDocument(this.documents.length - 1);
          } else {
            this.showDocument(this.currentIndex);
          }
        }
        setTimeout(() => this.successMessage = '', 2500);
      },
      error: (e) => {
        this.saving = false;
        this.error = 'Erreur: ' + (e.error?.message || e.statusText);
      }
    });
  }

  archive(): void {
    this.save('archive');
  }

  private revokePreview(): void {
    if (this.objectUrl && this.objectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.objectUrl);
    }
    this.objectUrl = undefined;
  }
}
