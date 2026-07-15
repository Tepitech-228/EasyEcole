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
  selectedFileName = '';
  selectedFileSize = '';
  folders: any[] = [];
  sessions: any[] = [];
  selectedFolderId?: number;
  selectedSessionId?: number;
  uploading = false;

  titre = '';
  reference = '';
  categorie = '';
  dureeConservation = '';
  archivedUntil?: string;
  isArchived = false;

  ocrData: { nbPages: number; auteur: string | null; motsCles: string[] } | null = null;

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.gedService.getFolders().subscribe({ next: f => this.folders = f });
    this.gedService.getSessions().subscribe({ next: s => this.sessions = s });
  }

  ngOnDestroy(): void {}

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('Seuls les fichiers PDF sont acceptés');
      return;
    }
    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.selectedFileSize = this.formatSize(file.size);
    this.titre = file.name.replace(/\.pdf$/i, '');
    this.simulateOcr();
  }

  removeFile() {
    this.selectedFile = undefined;
    this.selectedFileName = '';
    this.selectedFileSize = '';
    this.ocrData = null;
    this.titre = '';
    this.reference = '';
    this.categorie = '';
    this.dureeConservation = '';
    this.archivedUntil = undefined;
    this.isArchived = false;
    this.selectedFolderId = undefined;
    this.selectedSessionId = undefined;
  }

  private simulateOcr() {
    this.ocrData = {
      nbPages: Math.floor(Math.random() * 20) + 1,
      auteur: null,
      motsCles: []
    };
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading = true;

    const fd = new FormData();
    fd.append('fichier', this.selectedFile);
    fd.append('titre', this.titre || this.selectedFile.name);
    if (this.reference) fd.append('reference', this.reference);
    if (this.categorie) fd.append('categorie', this.categorie);
    if (this.selectedFolderId) fd.append('folderId', String(this.selectedFolderId));
    if (this.selectedSessionId) fd.append('sessionId', String(this.selectedSessionId));
    if (this.dureeConservation) fd.append('dureeConservation', this.dureeConservation);
    if (this.archivedUntil) fd.append('archivedUntil', this.archivedUntil);
    fd.append('isArchived', String(this.isArchived));

    this.gedService.upload(fd).subscribe({
      next: () => {
        alert('Document uploadé avec succès');
        this.removeFile();
        this.uploading = false;
      },
      error: (e) => {
        alert('Erreur: ' + (e.error?.message || e.statusText));
        this.uploading = false;
      }
    });
  }

  get keywordCount(): number {
    return this.ocrData?.motsCles?.length || 0;
  }

  private formatSize(bytes: number): string {
    if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' Mo';
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return bytes + ' o';
  }
}
