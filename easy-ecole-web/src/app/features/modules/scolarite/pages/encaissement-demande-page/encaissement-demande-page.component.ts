import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { RecuCaisseService } from 'src/app/data/modules/scolarite/services/recu-caisse.service';
import { DemandeDocumentArbreService } from 'src/app/data/modules/scolarite/services/demande-document-arbre.service';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { DossierNode, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-encaissement-demande-page',
  templateUrl: './encaissement-demande-page.component.html',
  styleUrls: ['./encaissement-demande-page.component.scss']
})
export class EncaissementDemandePageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = false;
  demandes: DemandeDocument[] = [];
  demandesFiltered: DemandeDocument[] = [];
  searchQuery: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  // Données de l'arbre (filières / niveaux / classes)
  parcoursList: Parcours[] = [];
  niveaux: NiveauEtude[] = [];
  classes: Classe[] = [];
  dataLoaded: boolean = false;
  treeNodes: DossierNode[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalItems: number = 0;
  totalPages: number = 1;

  // Modal encaissement
  showEncaissementModal: boolean = false;
  selectedDemande: DemandeDocument | null = null;
  modePaiement: string = 'especes';
  referencePaiement: string = '';
  montantRecu: number = 0;
  encaissementEnCours: boolean = false;

  // Dernier reçu généré
  showRecuModal: boolean = false;
  dernierRecu: any = null;

  // Actions disponibles par ligne
  itemActions: BatchAction[] = [
    { label: 'Encaisser', color: 'green', action: 'encaisser', icon: 'payments' },
    { label: 'Générer le reçu', color: 'indigo', action: 'genererRecu', icon: 'picture_as_pdf' }
  ];

  // Colonnes du tableau de feuilles
  itemColumns = [
    { key: 'numeroAffichage', label: 'N° demande' },
    { key: 'etudiantLabel', label: 'Étudiant' },
    { key: 'etudiantMatricule', label: 'Matricule' },
    { key: 'typeDocument', label: 'Document' },
    { key: 'montant', label: 'Montant' },
    { key: 'paiement', label: 'Paiement' },
    { key: 'date', label: 'Date' }
  ];

  constructor(
    private demandeService: DemandeDocumentService,
    private recuService: RecuCaisseService,
    private arbreService: DemandeDocumentArbreService,
    private parcoursService: ParcoursService,
    private niveauEtudeService: NiveauEtudeService,
    private classeService: ClasseService
  ) {
    super();
  }

  ngOnInit() {
    combineLatest([
      this.parcoursService.getAll(),
      this.niveauEtudeService.getAll(),
      this.classeService.getAll()
    ]).subscribe({
      next: ([parcoursList, niveaux, classes]) => {
        this.parcoursList = parcoursList;
        this.niveaux = niveaux;
        this.classes = classes;
        this.dataLoaded = true;
        this.loadDemandes();
      },
      error: () => {
        this.dataLoaded = true;
        this.loadDemandes();
      }
    });
  }

  get demandesEnAttentePaiement(): DemandeDocument[] {
    return this.demandes.filter(d => this.peutEncaisser(d));
  }

  get demandesPayees(): DemandeDocument[] {
    return this.demandes.filter(d => d.fraisPayes && Number(d.montant) > 0);
  }

  get montantTotalEncaissable(): number {
    return this.demandesEnAttentePaiement.reduce((s, d) => s + (Number(d.montant) || 0), 0);
  }

  get montantTotalEncaisse(): number {
    return this.demandesPayees.reduce((s, d) => s + (Number(d.montant) || 0), 0);
  }

  loadDemandes() {
    this.loading = true;
    this.errorMessage = '';
    this.demandeService.getAll({ page: this.currentPage, limit: this.pageSize }).subscribe({
      next: (data: any) => {
        this.demandes = data.data || data;
        this.totalItems = data.pagination?.total || this.demandes.length;
        this.totalPages = data.pagination?.totalPages || 1;
        this.filtrer();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des demandes';
        this.loading = false;
      }
    });
  }

  filtrer() {
    this.demandesFiltered = this.demandes.filter(d => {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return true;
      const etudiant = (d.etudiant as any) || {};
      return String(d.typeDocument?.libelle || '').toLowerCase().includes(q) ||
        String(etudiant.nom || '').toLowerCase().includes(q) ||
        String(etudiant.prenoms || '').toLowerCase().includes(q) ||
        String(etudiant.matricule || '').toLowerCase().includes(q) ||
        String(d.numeroDemande || '').toLowerCase().includes(q);
    });
    this.buildTreeNodes();
  }

  private buildTreeNodes(): void {
    this.treeNodes = this.arbreService.construireArbre(this.demandesFiltered, this.parcoursList, this.niveaux, this.classes);
  }

  /** Une demande est encaissable si payante, non réglée et issue d'une demande volontaire */
  peutEncaisser(d: DemandeDocument): boolean {
    return Number(d.montant) > 0 && !d.fraisPayes && d.source === 'demande_etudiant';
  }

  onItemAction(event: { item: any; action: string }): void {
    if (event.action === 'encaisser') {
      this.ouvrirModalEncaissement(event.item);
    } else if (event.action === 'genererRecu') {
      this.telechargerRecu(event.item.recuCaisse?.id || event.item.recuCaisseId);
    }
  }

  canShowAction(item: any, action: string): boolean {
    if (action === 'encaisser') return this.peutEncaisser(item);
    if (action === 'genererRecu') return !!(item.fraisPayes && (item.recuCaisse?.id || item.recuCaisseId));
    return false;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDemandes();
  }

  ouvrirModalEncaissement(demande: DemandeDocument) {
    this.selectedDemande = demande;
    this.montantRecu = Number(demande.montant) || 0;
    this.modePaiement = 'especes';
    this.referencePaiement = '';
    this.showEncaissementModal = true;
    this.errorMessage = '';
  }

  validerEncaissement() {
    if (!this.selectedDemande?.id) return;
    this.encaissementEnCours = true;
    this.errorMessage = '';

    this.recuService.collecterPaiement(
      this.selectedDemande.id,
      this.modePaiement,
      this.montantRecu,
      this.referencePaiement || undefined
    ).subscribe({
      next: (recu) => {
        this.encaissementEnCours = false;
        this.showEncaissementModal = false;
        this.dernierRecu = recu;
        this.showRecuModal = true;
        this.successMessage = `Encaissement effectué. Reçu ${recu.numero} généré.`;
        this.loadDemandes();
      },
      error: (err) => {
        this.encaissementEnCours = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de l\'encaissement';
      }
    });
  }

  telechargerRecu(recuId: string) {
    if (!recuId) return;
    this.recuService.download(recuId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RCU-${this.dernierRecu?.numero || recuId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'PDF en cours de génération. Réessayez dans quelques secondes.';
      }
    });
  }

  preparerDemande(demande: DemandeDocument) {
    if (!demande.id) return;
    this.demandeService.passerEnPreparation(demande.id).subscribe({
      next: () => {
        this.successMessage = 'Demande mise en préparation';
        this.loadDemandes();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la mise en préparation';
      }
    });
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'soumise': 'Soumise',
      'en_attente_paiement': 'En attente',
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

  modePaiementLabel(mode: string): string {
    switch (mode) {
      case 'especes': return 'Espèces';
      case 'mobile_money': return 'Mobile Money';
      case 'autre': return 'Autre';
      default: return mode;
    }
  }
}