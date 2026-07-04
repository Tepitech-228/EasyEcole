import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GedService, GedDocument, GedSession } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-session-detail-page',
  templateUrl: './ged-session-detail-page.component.html',
  styleUrls: ['./ged-session-detail-page.component.scss']
})
export class GedSessionDetailPageComponent implements OnInit, OnDestroy {
  session?: GedSession;
  loading = false;
  uploadFiles: File[] = [];
  selectedFolderId?: number;
  archivedUntil?: string;
  isArchived = false;
  batchMetadata = '';
  folders: any[] = [];
  previewUrl?: SafeResourceUrl | null = null;
  selectedPreviewFile?: File;
  private objectUrl?: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gedService: GedService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadSession();
    this.gedService.getFolders().subscribe({ next: (f) => this.folders = f });
  }

  ngOnDestroy(): void {
    this.clearPreviewUrl();
  }

  private async loadSession(): Promise<void> {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.gedService.getSession(id).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.uploadFiles = Array.from(input.files);
    this.setPreviewFile(this.uploadFiles[0]);
  }

  private setPreviewFile(file?: File): void {
    if (!file) {
      this.clearPreviewUrl();
      return;
    }

    this.clearPreviewUrl();
    this.selectedPreviewFile = file;
    if (file.type === 'application/pdf') {
      this.objectUrl = URL.createObjectURL(file);
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
    } else {
      this.previewUrl = null;
    }
  }

  async uploadBatch(): Promise<void> {
    if (!this.session || this.uploadFiles.length === 0) {
      return;
    }

    let metadata: Record<string, string> = {};
    try {
      metadata = this.batchMetadata ? JSON.parse(this.batchMetadata) : {};
    } catch {
      window.alert('Métadonnées invalides. Utilisez un JSON valide.');
      return;
    }

    this.gedService.batchUpload(
      String(this.session.id),
      this.uploadFiles,
      metadata,
      this.selectedFolderId,
      this.archivedUntil,
      this.isArchived
    ).subscribe({
      next: () => {
        window.alert('Documents ajoutés à la session');
        this.uploadFiles = [];
        this.batchMetadata = '';
        this.selectedFolderId = undefined;
        this.archivedUntil = undefined;
        this.isArchived = false;
        this.loadSession();
      },
      error: (e) => {
        window.alert('Erreur batch upload: ' + (e.error?.message || e.statusText));
      }
    });
  }

  getShareLink(): string {
    return `${window.location.origin}/ged/sessions/${this.session?.id}`;
  }

  copyShareLink(): void {
    const link = this.getShareLink();
    navigator.clipboard.writeText(link).then(() => {
      window.alert('Lien de partage copié');
    }).catch(() => {
      window.alert('Impossible de copier le lien');
    });
  }

  downloadDocument(doc: GedDocument): void {
    window.open(this.gedService.getDownloadUrl(String(doc.id)), '_blank');
  }

  private clearPreviewUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
    this.previewUrl = null;
  }
}
