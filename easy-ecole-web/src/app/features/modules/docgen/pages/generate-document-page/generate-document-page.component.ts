import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { DocGenType } from 'src/app/data/modules/docgen/models/DocGenType.model';

@Component({
  selector: 'app-generate-document-page',
  templateUrl: './generate-document-page.component.html',
  styleUrls: ['./generate-document-page.component.scss']
})
export class GenerateDocumentPageComponent extends BaseComponentClass implements OnInit {
  types: DocGenType[] = [];
  loading = false;
  generating = false;
  result: any = null;
  error: string | null = null;

  form: FormGroup = new FormGroup({
    typeCode: new FormControl('', [Validators.required]),
    etudiantId: new FormControl(''),
    classeId: new FormControl(''),
    anneeAcademiqueId: new FormControl(''),
    semestre: new FormControl(''),
    cursusApprenantId: new FormControl(''),
    sourceType: new FormControl(''),
    sourceId: new FormControl(''),
    metadata: new FormControl(''),
  });

  constructor(
    private documentService: DocGenDocumentService,
    private typeService: DocGenTypeService,
  ) { super(); }

  ngOnInit(): void {
    this.typeService.getAll().subscribe(types => this.types = types);
  }

  generate(): void {
    if (this.form.invalid) return;
    this.generating = true;
    this.error = null;
    this.result = null;

    const v = this.form.value;
    let meta = {};
    try {
      if (v.metadata) meta = JSON.parse(v.metadata);
    } catch {
      this.error = 'Métadonnées JSON invalides';
      this.generating = false;
      return;
    }

    const payload: any = {
      typeCode: v.typeCode,
      etudiantId: v.etudiantId ? Number(v.etudiantId) : undefined,
      classeId: v.classeId ? Number(v.classeId) : undefined,
      anneeAcademiqueId: v.anneeAcademiqueId ? Number(v.anneeAcademiqueId) : undefined,
      semestre: v.semestre || undefined,
      cursusApprenantId: v.cursusApprenantId ? Number(v.cursusApprenantId) : undefined,
      sourceType: v.sourceType || undefined,
      sourceId: v.sourceId ? Number(v.sourceId) : undefined,
      metadata: Object.keys(meta).length ? meta : undefined,
    };

    this.documentService.generate(payload).subscribe({
      next: (res) => {
        this.result = res;
        this.generating = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Erreur lors de la génération';
        this.generating = false;
      }
    });
  }

  download(doc: any): void {
    if (!doc?.id) return;
    this.documentService.download(doc.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.reference || 'document'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
