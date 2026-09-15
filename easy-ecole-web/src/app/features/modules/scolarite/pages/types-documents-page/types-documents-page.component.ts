import { Component, OnInit } from '@angular/core';
import { TypeDocument } from 'src/app/data/modules/scolarite/models/TypeDocument.model';
import { TypeDocumentService } from 'src/app/data/modules/scolarite/services/type-document.service';

@Component({
  selector: 'app-types-documents-page',
  templateUrl: './types-documents-page.component.html',
  styleUrls: ['./types-documents-page.component.scss']
})
export class TypesDocumentsPageComponent implements OnInit {
  types: TypeDocument[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formOpen = false;
  editingId: string | null = null;
  form: TypeDocument = { libelle: '', frais: 0 };

  constructor(private typeDocumentService: TypeDocumentService) {}

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    this.loading = true;
    this.errorMessage = '';
    this.typeDocumentService.getAll().subscribe({
      next: (types) => {
        this.types = types || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger les types de documents.';
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form = { libelle: '', frais: 0 };
    this.formOpen = true;
    this.errorMessage = '';
  }

  openEdit(type: TypeDocument): void {
    this.editingId = type.id || null;
    this.form = { ...type, frais: Number(type.frais) || 0 };
    this.formOpen = true;
    this.errorMessage = '';
  }

  closeForm(): void {
    if (!this.saving) this.formOpen = false;
  }

  save(): void {
    const libelle = this.form.libelle?.trim();
    if (!libelle) {
      this.errorMessage = 'Le libellé du document est obligatoire.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const payload: TypeDocument = { libelle, frais: Number(this.form.frais) || 0 };
    const request$ = this.editingId
      ? this.typeDocumentService.update({ ...payload, id: this.editingId })
      : this.typeDocumentService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.formOpen = false;
        this.successMessage = this.editingId ? 'Type de document modifié.' : 'Type de document créé.';
        this.loadTypes();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Enregistrement impossible.';
      }
    });
  }

  remove(type: TypeDocument): void {
    if (!type.id || !window.confirm(`Supprimer « ${type.libelle} » ?`)) return;
    this.typeDocumentService.delete(type.id).subscribe({
      next: () => {
        this.successMessage = 'Type de document supprimé.';
        this.loadTypes();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Suppression impossible.';
      }
    });
  }

  formatFrais(frais: number | undefined): string {
    return `${(Number(frais) || 0).toLocaleString('fr-FR')} FCFA`;
  }
}
