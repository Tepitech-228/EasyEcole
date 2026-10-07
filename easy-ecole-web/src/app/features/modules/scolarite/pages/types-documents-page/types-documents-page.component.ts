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
  form: TypeDocument = { libelle: '', frais: 0, piecesRequises: [] };

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
    this.form = { libelle: '', frais: 0, piecesRequises: [] };
    this.formOpen = true;
    this.errorMessage = '';
  }

  openEdit(type: TypeDocument): void {
    this.editingId = type.id || null;
    this.form = {
      ...type,
      frais: Number(type.frais) || 0,
      piecesRequises: (type.piecesRequises || []).map(piece => ({ ...piece }))
    };
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
    const pieces = (this.form.piecesRequises || []).map((piece, index) => {
      const libellePiece = piece.libelle.trim();
      return {
        cle: this.clePiece(libellePiece, index),
        libelle: libellePiece,
        obligatoire: piece.obligatoire !== false
      };
    });
    if (pieces.some(piece => !piece.libelle)) {
      this.errorMessage = 'Chaque pièce requise doit avoir un libellé.';
      return;
    }
    if (new Set(pieces.map(piece => piece.cle)).size !== pieces.length) {
      this.errorMessage = 'Les libellés des pièces doivent être uniques.';
      return;
    }
    const payload: TypeDocument = {
      libelle,
      frais: Number(this.form.frais) || 0,
      piecesRequises: pieces
    };
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

  ajouterPieceRequise(): void {
    this.form.piecesRequises = [...(this.form.piecesRequises || []), { cle: '', libelle: '', obligatoire: true }];
  }

  retirerPieceRequise(index: number): void {
    this.form.piecesRequises = (this.form.piecesRequises || []).filter((_piece, i) => i !== index);
  }

  private clePiece(libelle: string, index: number): string {
    const base = libelle.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    return base || `piece-${index + 1}`;
  }
}
