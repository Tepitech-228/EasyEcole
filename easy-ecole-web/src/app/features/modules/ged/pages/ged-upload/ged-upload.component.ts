import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GedService } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-upload',
  templateUrl: './ged-upload.component.html',
  styleUrls: ['./ged-upload.component.scss']
})
export class GedUploadComponent implements OnInit, OnDestroy {
  selectedFile?: File;
  selectedFileName: string = 'Aucun fichier sélectionné';
  folders: any[] = [];
  sessions: any[] = [];
  selectedFolderId?: number;
  selectedSessionId?: number;
  pdfPreviewUrl?: SafeResourceUrl | null = null;

  titre: string = '';
  reference: string = '';
  eleve: string = '';
  parcours: string = '';
  categorie: string = '';
  tags: string = '';
  nommage: string = '';
  dureeConservation: string = '';
  archivedUntil?: string;
  isArchived: boolean = false;

  private objectUrl?: string;

  constructor(private gedService: GedService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.gedService.getFolders().subscribe({ next: (f) => this.folders = f });
    this.gedService.getSessions().subscribe({ next: (sessions) => this.sessions = sessions });
  }

  ngOnDestroy(): void {
    this.clearPreviewUrl();
  }

  onFileChanged(event: File | null | Event) {
    let file: File | null = null;

    if (event instanceof File) {
      file = event;
    } else if (event && typeof (event as any).target?.files !== 'undefined') {
      file = (event as any).target.files[0] ?? null;
    }

    if (!file) {
      this.clearSelection();
      return;
    }

    this.clearPreviewUrl();
    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.titre = file.name;

    if (file.type === 'application/pdf') {
      this.objectUrl = URL.createObjectURL(file);
      this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
    } else {
      this.pdfPreviewUrl = null;
    }
  }

  upload() {
    if (!this.selectedFile) return;
    const fd = new FormData();
    fd.append('fichier', this.selectedFile);
    fd.append('titre', this.titre || this.selectedFile.name);
    fd.append('reference', this.reference || '');
    fd.append('eleve', this.eleve || '');
    fd.append('parcours', this.parcours || '');
    fd.append('categorie', this.categorie || '');
    fd.append('tags', this.tags || '');
    fd.append('nommage', this.nommage || '');
    fd.append('dureeConservation', this.dureeConservation || '');
    if (this.archivedUntil) {
      fd.append('archivedUntil', this.archivedUntil);
    }
    fd.append('isArchived', String(this.isArchived));
    if (this.selectedFolderId) fd.append('folderId', String(this.selectedFolderId));
    if (this.selectedSessionId) fd.append('sessionId', String(this.selectedSessionId));

    this.gedService.upload(fd).subscribe({
      next: () => {
        window.alert('Upload OK');
        this.clearSelection();
      },
      error: (e) => window.alert('Erreur upload: ' + (e.error?.message || e.statusText))
    });
  }

  private clearSelection() {
    this.selectedFile = undefined;
    this.selectedFileName = 'Aucun fichier sélectionné';
    this.clearPreviewUrl();
    this.titre = '';
    this.reference = '';
    this.eleve = '';
    this.parcours = '';
    this.categorie = '';
    this.tags = '';
    this.nommage = '';
    this.dureeConservation = '';
    this.archivedUntil = undefined;
    this.isArchived = false;
    this.selectedFolderId = undefined;
  }

  private clearPreviewUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
    this.pdfPreviewUrl = null;
  }
}
