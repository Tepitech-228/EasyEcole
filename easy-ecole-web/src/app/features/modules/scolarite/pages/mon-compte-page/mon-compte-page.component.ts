import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';
import { LigneFraisEtudiant, LigneFraisEtudiantService } from 'src/app/data/modules/comptabilite/services/ligne-frais-etudiant.service';
import { EtablissementService } from 'src/app/data/modules/etablissement/services/etablissement.service';

const TYPE_LIBELLES: Record<string, string> = {
  inscription: "Frais d'inscription",
  scolarite: 'Frais de scolarité',
  bibliotheque: 'Frais de bibliothèque',
  assurance: "Frais d'assurance",
  logement: 'Frais de logement',
  document: 'Frais de document',
  penalite: 'Pénalité de retard',
};

@Component({
  selector: 'app-mon-compte-page',
  templateUrl: './mon-compte-page.component.html',
  styleUrls: ['./mon-compte-page.component.scss']
})
export class MonComptePageComponent extends BaseComponentClass implements OnInit {
  soldeActuel: number = 0;
  transactions: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  get devise(): string {
    return this.etablissementService.etablissement?.devise || 'FCFA'
  }

  get nbPaiementsEffectues(): number {
    return this.transactions.filter(t => t.statut === 'paye' && t.type === 'debit').length;
  }

  get nbImpayes(): number {
    return this.transactions.filter(t => t.statut === 'impaye').length;
  }

  constructor(
    private dossierEtudiantService: DossierEtudiantService,
    private ligneFraisEtudiantService: LigneFraisEtudiantService,
    private etablissementService: EtablissementService
  ) { super() }

  ngOnInit() {
    this.chargerSolde();
    this.chargerTransactions();
  }

  chargerSolde() {
    this.loading = true;
    // Le solde est dérivé des lignes de frais du dossier de l'étudiant connecté.
    this.dossierEtudiantService.getMonDossier().subscribe({
      next: (dossier: any) => {
        this.ligneFraisEtudiantService.getByDossier(dossier.id).subscribe({
          next: (lignes: LigneFraisEtudiant[]) => {
            this.soldeActuel = lignes.reduce((s, l) => s + (Number(l.solde) || 0), 0);
            this.loading = false;
          },
          error: () => { this.soldeActuel = 0; this.loading = false; }
        });
      },
      error: () => { this.soldeActuel = 0; this.loading = false; }
    });
  }

  chargerTransactions() {
    this.dossierEtudiantService.getMonDossier().subscribe({
      next: (dossier: any) => {
        this.ligneFraisEtudiantService.getByDossier(dossier.id).subscribe({
          next: (lignes: LigneFraisEtudiant[]) => {
            this.transactions = lignes.map(l => ({
              date: l.createdAt,
              libelle: TYPE_LIBELLES[l.type] || l.type,
              montant: Number(l.montant) || 0,
              type: 'debit',
              statut: l.paye ? 'paye' : 'impaye',
            }));
          },
          error: () => { this.transactions = []; }
        });
      },
      error: () => { this.transactions = []; }
    });
  }

  payerEnLigne() {
    alert('Redirection vers CinetPay (intégration à venir)');
  }

  telechargerFacture(transaction: any) {
    alert('Téléchargement de la facture (à implémenter)');
  }

  telechargerQuitus() {
    alert('Téléchargement du quitus (à implémenter)');
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'paye': return 'Payé';
      case 'impaye': return 'Impayé';
      case 'en_attente': return 'En attente';
      default: return statut;
    }
  }

  statutColor(statut: string): string {
    switch (statut) {
      case 'paye': return 'green';
      case 'impaye': return 'red';
      case 'en_attente': return 'yellow';
      default: return 'gray';
    }
  }
}
