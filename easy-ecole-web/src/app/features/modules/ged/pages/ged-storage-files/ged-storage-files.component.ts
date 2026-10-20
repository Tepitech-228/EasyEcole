import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  StoredFile,
  StoredFileChoice,
  StoredFileFilters,
  StoredFileOptions,
  StoredFilesService
} from 'src/app/data/modules/ged/services/stored-files.service';

@Component({
  selector: 'app-ged-storage-files',
  templateUrl: './ged-storage-files.component.html',
  styleUrls: ['./ged-storage-files.component.scss']
})
export class GedStorageFilesComponent implements OnInit, OnDestroy {
  files: StoredFile[] = [];
  options: StoredFileOptions = { sites: [], annees: [], niveaux: [], parcours: [], classes: [] };
  filters: StoredFileFilters = {};
  page = 1;
  pageSize = 25;
  total = 0;
  loading = false;
  importing = false;
  message = '';
  error = '';
  selectedFile: File | null = null;
  titre = '';
  categorie: StoredFile['categorie'] = 'academique';
  etablissementId = '';
  anneeAcademiqueId = '';
  filiere = '';
  niveauEtudeId = '';
  parcoursId = '';
  classeId = '';
  previewTitle = '';
  previewUrl: SafeResourceUrl | null = null;
  private previewObjectUrl: string | null = null;

  readonly categories: Array<{ value: StoredFile['categorie']; label: string }> = [
    { value: 'academique', label: 'Académique' },
    { value: 'financier', label: 'Financier' },
    { value: 'administratif', label: 'Administratif' },
    { value: 'autre', label: 'Autre' }
  ];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  constructor(private service: StoredFilesService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.service.getOptions().subscribe({
      next: options => {
        this.options = options;
        if (options.sites.length === 1) this.etablissementId = String(options.sites[0].id);
      },
      error: () => { this.error = 'Impossible de charger les sites et les choix de classement.'; }
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.releasePreview();
  }

  load(): void {
    this.loading = true;
    this.service.list(this.filters, this.page).subscribe({
      next: result => {
        this.files = result.files;
        this.total = result.total;
        this.loading = false;
        this.error = '';
      },
      error: () => {
        this.error = 'Impossible de charger les fichiers. Vérifiez vos droits et réessayez.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.filters = {};
    this.page = 1;
    this.load();
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    if (this.selectedFile && !this.titre) this.titre = this.selectedFile.name.replace(/\.pdf$/i, '');
  }

  importFile(): void {
    if (!this.selectedFile || !this.etablissementId) {
      this.error = 'Sélectionnez un PDF et le site auquel le classer.';
      return;
    }
    const data = new FormData();
    data.append('file', this.selectedFile, this.selectedFile.name);
    data.append('titre', this.titre);
    data.append('categorie', this.categorie);
    data.append('etablissementId', this.etablissementId);
    data.append('anneeAcademiqueId', this.anneeAcademiqueId);
    data.append('filiere', this.filiere);
    data.append('niveauEtudeId', this.niveauEtudeId);
    data.append('parcoursId', this.parcoursId);
    data.append('classeId', this.classeId);
    this.importing = true;
    this.error = '';
    this.message = '';
    this.service.upload(data).subscribe({
      next: () => {
        this.importing = false;
        this.message = 'PDF importé, classé et enregistré avec son empreinte SHA-256.';
        this.selectedFile = null;
        this.titre = '';
        this.load();
      },
      error: err => {
        this.importing = false;
        this.error = err?.error?.message || 'L’import du PDF a échoué.';
      }
    });
  }

  preview(file: StoredFile): void {
    this.service.content(file.id).subscribe({
      next: blob => {
        this.releasePreview();
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
        this.previewTitle = file.titre;
      },
      error: err => { this.error = err?.error?.message || 'Le fichier ne peut pas être affiché.'; }
    });
  }

  download(file: StoredFile): void {
    this.service.content(file.id).subscribe({
      next: blob => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = file.nomFichier;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: err => { this.error = err?.error?.message || 'Le téléchargement a échoué.'; }
    });
  }

  verify(file: StoredFile): void {
    this.service.verify(file.id).subscribe({
      next: result => {
        this.message = result.valid
          ? (result.baselineCreated ? 'Empreinte SHA-256 initiale créée et vérifiée.' : 'Intégrité vérifiée : le fichier est intact.')
          : 'ALERTE : le contenu du fichier ne correspond plus à son empreinte SHA-256.';
        this.error = result.valid ? '' : this.message;
      },
      error: err => { this.error = err?.error?.message || 'La vérification a échoué.'; }
    });
  }

  exportCsv(): void {
    this.service.exportCsv(this.filters).subscribe({
      next: blob => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = 'catalogue-fichiers.csv';
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: () => { this.error = 'L’export du catalogue a échoué.'; }
    });
  }

  changePage(delta: number): void {
    const lastPage = Math.max(1, Math.ceil(this.total / this.pageSize));
    this.page = Math.min(lastPage, Math.max(1, this.page + delta));
    this.load();
  }

  labelFor(choices: StoredFileChoice[], id: number | null): string {
    return choices.find(choice => choice.id === id)?.label || (id ? `#${id}` : '—');
  }

  formatSize(bytes: number): string {
    if (!bytes) return '—';
    return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  closePreview(): void {
    this.releasePreview();
    this.previewUrl = null;
  }

  private releasePreview(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
}
