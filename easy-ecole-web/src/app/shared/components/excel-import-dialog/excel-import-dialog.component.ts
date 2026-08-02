import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExcelService, ExcelImportResult } from 'src/app/data/modules/inscription/services/excel.service';

@Component({
  selector: 'app-excel-import-dialog',
  templateUrl: './excel-import-dialog.component.html',
  styleUrls: ['./excel-import-dialog.component.scss']
})
export class ExcelImportDialogComponent {

  /** Titre affiché dans la modale */
  @Input() title: string = 'Import Excel';
  /** Sous-titre */
  @Input() subtitle: string = 'Sélectionnez un fichier Excel (.xlsx) à importer';
  /** Nom du template à télécharger */
  @Input() templateFilename: string = 'template.xlsx';
  /** Couleur du thème (indigo, blue, green, etc.) */
  @Input() themeColor: string = 'indigo';

  /** Fonction de téléchargement du template (injectée par le parent) */
  @Input() downloadTemplate: (() => void) | null = null;
  /** Fonction d'import (injectée par le parent) — reçoit le fichier, retourne l'observable */
  @Input() importFn: ((file: File) => any) | null = null;
  /** Fonction appelée après un import réussi */
  @Output() imported: EventEmitter<ExcelImportResult> = new EventEmitter();

  showModal: boolean = false;
  selectedFile: File | null = null;
  loading: boolean = false;
  error: string = '';
  result: ExcelImportResult | null = null;

  constructor() {}

  open(): void {
    this.showModal = true;
    this.selectedFile = null;
    this.error = '';
    this.result = null;
    this.loading = false;
  }

  close(): void {
    this.showModal = false;
    this.selectedFile = null;
    this.error = '';
    this.result = null;
    this.loading = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        this.error = 'Seuls les fichiers Excel (.xlsx, .xls) sont acceptés.';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.error = '';
    }
  }

  onDownloadTemplate(): void {
    if (this.downloadTemplate) {
      this.downloadTemplate();
    }
  }

  onImport(): void {
    if (!this.selectedFile || !this.importFn) return;

    this.loading = true;
    this.error = '';
    this.result = null;

    this.importFn(this.selectedFile).subscribe({
      next: (res: ExcelImportResult) => {
        this.loading = false;
        this.result = res;
        if (res.success && res.errorCount === 0) {
          this.imported.emit(res);
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || err.message || 'Erreur lors de l\'import.';
      }
    });
  }

  getResultSummary(): string {
    if (!this.result) return '';
    const total = this.result.importedCount + this.result.errorCount;
    return `${this.result.importedCount}/${total} ligne(s) importée(s) avec succès, ${this.result.errorCount} erreur(s).`;
  }
}
