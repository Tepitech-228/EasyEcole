import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GedService, GedDomain, GedDocumentType } from 'src/app/data/modules/ged/services/ged.service';

interface SelectedFile {
  file: File;
  name: string;
  size: string;
  status: 'pending' | 'ocr_done' | 'error';
  ocrInfo?: string;
}

@Component({
  selector: 'app-ged-batch-upload',
  templateUrl: './ged-batch-upload.component.html',
  styleUrls: ['./ged-batch-upload.component.scss']
})
export class GedBatchUploadComponent implements OnInit {
  @ViewChild('batchFileInput') batchFileInput!: ElementRef<HTMLInputElement>;
  files: SelectedFile[] = [];
  uploading = false;

  annees: any[] = [];
  domains: GedDomain[] = [];
  documentTypes: GedDocumentType[] = [];

  selectedAnneeId?: number;
  selectedDomainId?: number;
  selectedDocumentTypeId?: number;
  selectedDateDocument = '';
  selectedConfidentiality = 'interne';
  selectedSourceType = 'numerisation';

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.gedService.getAnneesAcademiques().subscribe({ next: a => this.annees = a });
    this.gedService.getDomains().subscribe({ next: d => this.domains = d });
  }

  onDomainChange(): void {
    this.selectedDocumentTypeId = undefined;
    this.documentTypes = [];
    if (this.selectedDomainId) {
      this.gedService.getDocumentTypes(this.selectedDomainId).subscribe({ next: t => this.documentTypes = t });
    }
  }

  openFilePicker(): void {
    this.batchFileInput?.nativeElement?.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      if (file.type !== 'application/pdf') continue;
      this.files.push({
        file,
        name: file.name,
        size: this.formatSize(file.size),
        status: 'pending'
      });
    }
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer?.files) return;
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file = event.dataTransfer.files[i];
      if (file.type !== 'application/pdf') continue;
      this.files.push({
        file,
        name: file.name,
        size: this.formatSize(file.size),
        status: 'pending'
      });
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  upload(): void {
    if (this.files.length === 0) return;
    this.uploading = true;

    const pdfs = this.files.map(f => f.file);
    const metadata: Record<string, any> = {
      anneeAcademiqueId: this.selectedAnneeId,
      domainId: this.selectedDomainId,
      documentTypeId: this.selectedDocumentTypeId,
      confidentialityLevel: this.selectedConfidentiality,
      sourceType: this.selectedSourceType,
      dateDocument: this.selectedDateDocument || undefined
    };

    this.gedService.batchUploadEnhanced(pdfs, metadata).subscribe({
      next: (res) => {
        alert(`${res.total || res.data?.length || 0} document(s) importé(s) avec succès`);
        this.files = [];
        this.uploading = false;
      },
      error: (e) => {
        alert('Erreur: ' + (e.error?.message || e.statusText));
        this.uploading = false;
      }
    });
  }

  private formatSize(bytes: number): string {
    if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' Mo';
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return bytes + ' o';
  }
}
