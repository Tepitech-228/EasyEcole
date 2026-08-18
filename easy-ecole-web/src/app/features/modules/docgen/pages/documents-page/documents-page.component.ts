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
  generateData = {
    typeCode: '',
    sourceType: '',
    sourceId: undefined as number | undefined,
    cursusApprenantId: undefined as number | undefined,
    classeId: undefined as number | undefined,
    anneeAcademiqueId: undefined as number | undefined,
    etudiantId: undefined as number | undefined,
    semestre: '',
    metadata: '',
  };

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
    this.generateData = { typeCode: '', sourceType: '', sourceId: undefined, cursusApprenantId: undefined, classeId: undefined, anneeAcademiqueId: undefined, etudiantId: undefined, semestre: '', metadata: '' };
    this.showGenerateModal = true;
  }

  generer(): void {
    if (!this.generateData.typeCode) return;
    let metadata = {};
    try { if (this.generateData.metadata) metadata = JSON.parse(this.generateData.metadata); } catch {}
    const payload: any = {
      typeCode: this.generateData.typeCode,
      sourceType: this.generateData.sourceType || undefined,
      sourceId: this.generateData.sourceId,
      cursusApprenantId: this.generateData.cursusApprenantId,
      classeId: this.generateData.classeId,
      anneeAcademiqueId: this.generateData.anneeAcademiqueId,
      etudiantId: this.generateData.etudiantId,
      semestre: this.generateData.semestre || undefined,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    };
    // API001 : le controller backend extrait sourceId du body sans le réinjecter dans les params du resolver.
    // Le resolver resolveAutorisationProvisoire lit params.sourceId || params.cursusApprenantId,
    // on passe donc l'id de la demande via cursusApprenantId en attendant le correctif backend.
    if (this.generateData.typeCode === 'API001' && payload.sourceId) {
      payload.sourceType = 'demande_inscription';
      payload.cursusApprenantId = payload.sourceId;
    }
    this.documentService.generate(payload).subscribe({
      next: () => { this.showGenerateModal = false; this.getDocuments(); },
      error: (err) => alert('Erreur: ' + (err.error?.message || err.message || 'Erreur lors de la génération'))
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
