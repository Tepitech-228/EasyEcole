import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { RecuCaisseService } from 'src/app/data/modules/scolarite/services/recu-caisse.service';

@Component({
  selector: 'app-file-impression-documents-page',
  templateUrl: './file-impression-documents-page.component.html'
})
export class FileImpressionDocumentsPageComponent extends BaseComponentClass implements OnInit {
  etat: 'a_imprimer' | 'imprimes' = 'a_imprimer';
  demandes: any[] = [];
  page = 1;
  totalPages = 1;
  total = 0;
  loading = false;
  actionId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private demandeService: DemandeDocumentService,
    private recuService: RecuCaisseService
  ) {
    super();
  }

  ngOnInit(): void {
    this.chargerFile();
  }

  changerFile(etat: 'a_imprimer' | 'imprimes'): void {
    this.etat = etat;
    this.page = 1;
    this.chargerFile();
  }

  chargerFile(): void {
    this.loading = true;
    this.errorMessage = '';
    this.recuService.getFileImpression(this.etat, this.page).subscribe({
      next: result => {
        this.demandes = result.data || [];
        this.total = result.pagination?.total || 0;
        this.totalPages = result.pagination?.totalPages || 1;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || "Impossible de charger la file d'impression.";
      }
    });
  }

  changerPage(page: number): void {
    if (page < 1 || page > this.totalPages || this.loading) return;
    this.page = page;
    this.chargerFile();
  }

  ouvrirDocument(demande: any): void {
    if (!demande?.id) return;
    this.actionId = Number(demande.id);
    this.errorMessage = '';
    const fenetre = window.open('', '_blank');
    this.demandeService.telechargerDocumentPret(String(demande.id)).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        if (fenetre) fenetre.location.href = url;
        else {
          const lien = document.createElement('a');
          lien.href = url;
          lien.download = `${demande.typeDocument?.libelle || 'document'}-${demande.numeroDemande || demande.id}.pdf`;
          lien.click();
        }
        this.actionId = null;
      },
      error: err => {
        if (fenetre) fenetre.close();
        this.actionId = null;
        this.errorMessage = err?.error?.message || 'Impossible de télécharger le document prêt.';
      }
    });
  }

  confirmerImpression(demande: any): void {
    if (!demande?.id) return;
    this.actionId = Number(demande.id);
    this.errorMessage = '';
    this.demandeService.confirmerImpression(String(demande.id)).subscribe({
      next: () => {
        this.actionId = null;
        this.successMessage = `L'impression du document de ${demande.etudiant?.nom || ''} ${demande.etudiant?.prenoms || ''} est enregistrée.`;
        this.chargerFile();
      },
      error: err => {
        this.actionId = null;
        this.errorMessage = err?.error?.message || "Impossible de confirmer l'impression.";
      }
    });
  }
}
