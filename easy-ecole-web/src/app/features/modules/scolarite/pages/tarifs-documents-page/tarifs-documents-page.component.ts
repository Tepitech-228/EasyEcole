import { Component, OnInit } from '@angular/core';
import { TarifTypeDocument } from 'src/app/data/modules/scolarite/models/TypeDocument.model';
import { TypeDocumentService } from 'src/app/data/modules/scolarite/services/type-document.service';

@Component({
  selector: 'app-tarifs-documents-page',
  templateUrl: './tarifs-documents-page.component.html'
})
export class TarifsDocumentsPageComponent implements OnInit {
  tarifs: TarifTypeDocument[] = [];
  savingIds = new Set<string | number>();
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private typeDocumentService: TypeDocumentService) {}

  ngOnInit(): void {
    this.loadTarifs();
  }

  loadTarifs(): void {
    this.loading = true;
    this.errorMessage = '';
    this.typeDocumentService.getTarifs().subscribe({
      next: tarifs => {
        this.tarifs = tarifs.map(tarif => ({
          id: String(tarif.id),
          libelle: tarif.libelle,
          frais: Number(tarif.frais) || 0
        }));
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger les tarifs des documents.';
      }
    });
  }

  enregistrer(tarif: TarifTypeDocument): void {
    const frais = Number(tarif.frais);
    if (!Number.isFinite(frais) || frais < 0) {
      this.errorMessage = 'Saisissez un montant positif ou nul.';
      return;
    }
    if (this.savingIds.has(tarif.id)) return;

    this.savingIds.add(tarif.id);
    this.errorMessage = '';
    this.successMessage = '';
    this.typeDocumentService.updateFrais(tarif.id, frais).subscribe({
      next: result => {
        tarif.frais = Number(result.frais);
        this.savingIds.delete(tarif.id);
        this.successMessage = `Tarif de « ${tarif.libelle} » enregistré.`;
      },
      error: err => {
        this.savingIds.delete(tarif.id);
        this.errorMessage = err?.error?.message || `Impossible d'enregistrer le tarif de « ${tarif.libelle} ».`;
      }
    });
  }
}
