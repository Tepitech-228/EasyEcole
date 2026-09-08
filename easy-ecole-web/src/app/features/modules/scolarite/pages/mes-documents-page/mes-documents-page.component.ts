import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { RecuCaisseService } from 'src/app/data/modules/scolarite/services/recu-caisse.service';
import { MesDocumentItem } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';

@Component({
  selector: 'app-mes-documents-page',
  templateUrl: './mes-documents-page.component.html',
  styleUrls: ['./mes-documents-page.component.scss']
})
export class MesDocumentsPageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = false;
  documents: MesDocumentItem[] = [];
  documentsFiltered: MesDocumentItem[] = [];
  filterStatut: string = 'all';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private demandeService: DemandeDocumentService,
    private recuService: RecuCaisseService
  ) {
    super();
  }

  ngOnInit() {
    this.loadDocuments();
  }

  get countPrets(): number {
    return this.documents.filter(d => d.statut === 'document_pret' || d.estImprimable).length;
  }

  get countEnAttente(): number {
    return this.documents.filter(d => d.estEnAttentePaiement).length;
  }

  loadDocuments() {
    this.loading = true;
    this.errorMessage = '';
    this.demandeService.getMesDocuments().subscribe({
      next: (data) => {
        this.documents = data;
        this.filtrer();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement de vos documents';
        this.loading = false;
      }
    });
  }

  filtrer() {
    this.documentsFiltered = this.documents.filter(d => {
      if (this.filterStatut === 'all') return true;
      if (this.filterStatut === 'paye') return d.fraisPayes;
      if (this.filterStatut === 'en_attente') return d.estEnAttentePaiement;
      if (this.filterStatut === 'pret') return d.estTelechargeable || d.estImprimable;
      if (this.filterStatut === 'auto') return d.source === 'automatique';
      return d.statut === this.filterStatut;
    });
  }

  telechargerDocument(doc: MesDocumentItem) {
    const filePath = doc.fichierPDF || doc.documentDelivre?.fichierPDF;
    if (!filePath) {
      this.errorMessage = 'Document non disponible';
      return;
    }
    // Téléchargement via l'API de génération de documents
    window.open(`/api/v1/scolarite/demandesDocument/${doc.id}/telecharger`, '_blank');
  }

  telechargerRecu(doc: MesDocumentItem) {
    if (!doc.recuCaisse || !doc.recuCaisse.id) return;
    this.recuService.download(String(doc.recuCaisse.id)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RCU-${doc.recuCaisse!.numero}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Reçu non disponible pour le moment';
      }
    });
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'soumise': 'Soumise',
      'en_attente_paiement': 'En attente de paiement',
      'paye': 'Payé',
      'en_preparation': 'En préparation',
      'document_pret': 'Document prêt',
      'remise': 'Remis',
      'rejetee': 'Rejetée',
      'annulee': 'Annulée',
      'validee': 'Validée',
      'delivree': 'Délivrée'
    };
    return labels[statut] || statut;
  }

  statutColor(statut: string): string {
    const colors: Record<string, string> = {
      'soumise': '#eab308',
      'en_attente_paiement': '#f97316',
      'paye': '#22c55e',
      'en_preparation': '#3b82f6',
      'document_pret': '#8b5cf6',
      'remise': '#10b981',
      'rejetee': '#ef4444',
      'annulee': '#6b7280'
    };
    return colors[statut] || '#6b7280';
  }
}
