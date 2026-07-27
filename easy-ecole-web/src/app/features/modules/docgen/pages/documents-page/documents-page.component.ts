import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { DocGenDocument } from 'src/app/data/modules/docgen/models/DocGenDocument.model';
import { DocGenType } from 'src/app/data/modules/docgen/models/DocGenType.model';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-documents-page',
  templateUrl: './documents-page.component.html',
  styleUrls: ['./documents-page.component.scss']
})
export class DocumentsPageComponent extends BaseComponentClass implements OnInit {
  documents: DocGenDocument[] = [];
  types: DocGenType[] = [];
  filteredDocuments: DocGenDocument[] = [];
  loading = false;
  selectedTypeId: string = '';
  selectedStatut: string = '';
  search: string = '';
  showGenerateModal = false;
  generateData = { typeCode: '', sourceType: '', sourceId: undefined as number | undefined, metadata: '' };

  constructor(
    private documentService: DocGenDocumentService,
    private typeService: DocGenTypeService,
  ) { super(); }

  ngOnInit(): void {
    this.typeService.getAll().subscribe(types => this.types = types);
    this.getDocuments();
  }

  getDocuments(): void {
    this.loading = true;
    const params: any = {};
    if (this.selectedTypeId) params.typeId = this.selectedTypeId;
    if (this.selectedStatut) params.statut = this.selectedStatut;
    this.documentService.getAll(params).subscribe({
      next: (res) => { this.documents = res; this.filtrer(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  filtrer(): void {
    this.filteredDocuments = this.documents.filter(d => {
      if (this.search && !d.reference?.toLowerCase().includes(this.search.toLowerCase())) return false;
      return true;
    });
  }

  ouvrirGeneration(): void {
    this.generateData = { typeCode: '', sourceType: '', sourceId: undefined, metadata: '' };
    this.showGenerateModal = true;
  }

  generer(): void {
    if (!this.generateData.typeCode) return;
    let metadata = {};
    try { if (this.generateData.metadata) metadata = JSON.parse(this.generateData.metadata); } catch {}
    this.documentService.generate({
      typeCode: this.generateData.typeCode,
      sourceType: this.generateData.sourceType || undefined,
      sourceId: this.generateData.sourceId,
      metadata,
    }).subscribe({
      next: () => { this.showGenerateModal = false; this.getDocuments(); },
      error: (err) => alert('Erreur: ' + err.message)
    });
  }

  download(doc: DocGenDocument): void {
    if (!doc.id) return;
    this.documentService.download(doc.id).subscribe(blob => {
      saveAs(blob, `${doc.reference || 'document'}.pdf`);
    });
  }

  getStatutBadge(statut?: string): string {
    const map: any = { 'brouillon': 'bg-gray-100 text-gray-700', 'en_attente_enseignant': 'bg-amber-50 text-amber-700', 'en_attente_directeur': 'bg-blue-50 text-blue-700', 'signé': 'bg-green-50 text-green-700' };
    return map[statut || ''] || 'bg-gray-100 text-gray-700';
  }

  getStatutLabel(statut?: string): string {
    const map: any = { 'brouillon': 'Brouillon', 'en_attente_enseignant': 'Attente enseignant', 'en_attente_directeur': 'Attente directeur', 'signé': 'Signé' };
    return map[statut || ''] || statut || '—';
  }
}
