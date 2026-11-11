import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RecuCaisseService } from 'src/app/data/modules/scolarite/services/recu-caisse.service';

interface EtudiantPaiement {
  id: number;
  nom: string;
  prenoms: string;
  matricule: string;
}

interface TypeDocumentEncaissement {
  id: number;
  libelle: string;
  frais: number;
}

@Component({
  selector: 'app-paiement-documents-wizard-page',
  templateUrl: './paiement-documents-wizard-page.component.html',
  styleUrls: ['./paiement-documents-wizard-page.component.scss']
})
export class PaiementDocumentsWizardPageComponent extends BaseComponentClass implements OnInit {
  etape = 1;
  recherche = '';
  etudiants: EtudiantPaiement[] = [];
  etudiant: EtudiantPaiement | null = null;
  typesDocuments: TypeDocumentEncaissement[] = [];
  typeDocumentId: number | null = null;
  modePaiement: 'especes' | 'mobile_money' | 'autre' = 'especes';
  referencePaiement = '';
  recu: any = null;
  loading = false;
  loadingTypes = false;
  searching = false;
  hasSearched = false;
  errorMessage = '';
  successMessage = '';

  constructor(private recuService: RecuCaisseService) {
    super();
  }

  ngOnInit(): void {
    this.loadingTypes = true;
    this.recuService.getTypesDocumentsEncaissement().subscribe({
      next: types => {
        this.typesDocuments = (types || []).map(type => ({
          ...type,
          frais: Number(type.frais) || 0
        }));
        this.loadingTypes = false;
      },
      error: err => {
        this.loadingTypes = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger les tarifs des documents.';
      }
    });
  }

  get typeSelectionne(): TypeDocumentEncaissement | undefined {
    return this.typesDocuments.find(type => type.id === this.typeDocumentId);
  }

  get typesAvecTarif(): boolean {
    return this.typesDocuments.some(type => type.frais > 0);
  }

  rechercherEtudiants(): void {
    const search = this.recherche.trim();
    if (search.length < 2) {
      this.errorMessage = 'Saisissez au moins 2 caractères pour rechercher un étudiant.';
      return;
    }
    this.searching = true;
    this.hasSearched = false;
    this.errorMessage = '';
    this.recuService.rechercherEtudiants(search).subscribe({
      next: result => {
        this.etudiants = result.data || [];
        this.searching = false;
        this.hasSearched = true;
      },
      error: err => {
        this.searching = false;
        this.errorMessage = err?.error?.message || 'La recherche des étudiants a échoué.';
      }
    });
  }

  selectionnerEtudiant(etudiant: EtudiantPaiement): void {
    this.etudiant = etudiant;
    this.etudiants = [];
    this.hasSearched = false;
    this.etape = 2;
    this.errorMessage = '';
  }

  continuerVersPaiement(): void {
    if (!this.typeDocumentId || !this.modePaiement || !this.typeSelectionne) {
      this.errorMessage = 'Sélectionnez le document à payer.';
      return;
    }
    if (this.typeSelectionne.frais <= 0) {
      this.errorMessage = 'Le tarif de ce document doit être défini avant l’encaissement.';
      return;
    }
    if (this.modePaiement !== 'especes' && !this.referencePaiement.trim()) {
      this.errorMessage = 'Saisissez la référence du paiement.';
      return;
    }
    this.errorMessage = '';
    this.etape = 3;
  }

  encaisser(): void {
    if (!this.etudiant || !this.typeDocumentId || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.recuService.encaisserPaiementDocument({
      etudiantId: this.etudiant.id,
      typeDocumentId: this.typeDocumentId,
      modePaiement: this.modePaiement,
      referencePaiement: this.referencePaiement.trim() || undefined
    }).subscribe({
      next: recu => {
        this.recu = recu;
        this.loading = false;
        this.etape = 4;
        this.successMessage = 'Paiement enregistré et reçu PDF généré.';
      },
      error: err => {
        this.loading = false;
        if (err?.error?.recuId) {
          this.recu = {
            id: err.error.recuId,
            numero: err.error.numero,
            montant: this.typeSelectionne?.frais
          };
          this.etape = 4;
          this.errorMessage = err.error.message || 'Le paiement est enregistré, mais le reçu PDF doit être régénéré.';
          return;
        }
        this.errorMessage = err?.error?.message || 'Impossible d’enregistrer le paiement.';
      }
    });
  }

  telechargerRecu(): void {
    if (!this.recu?.id) return;
    this.recuService.downloadRecuDocument(this.recu.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = `RCU-${this.recu.numero || this.recu.id}.pdf`;
        lien.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => this.errorMessage = err?.error?.message || 'Impossible de télécharger le reçu.'
    });
  }

  nouvelleOperation(): void {
    this.etape = 1;
    this.recherche = '';
    this.etudiants = [];
    this.hasSearched = false;
    this.etudiant = null;
    this.typeDocumentId = null;
    this.modePaiement = 'especes';
    this.referencePaiement = '';
    this.recu = null;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
