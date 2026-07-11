import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

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

  get nbPaiementsEffectues(): number {
    return this.transactions.filter(t => t.statut === 'paye' && t.type === 'debit').length;
  }

  get nbImpayes(): number {
    return this.transactions.filter(t => t.statut === 'impaye').length;
  }

  ngOnInit() {
    this.chargerSolde();
    this.chargerTransactions();
  }

  chargerSolde() {
    this.loading = true;
    this.soldeActuel = 150000;
    this.loading = false;
  }

  chargerTransactions() {
    this.transactions = [
      { date: '2026-06-15', libelle: 'Frais d\'inscription 2026-2027', montant: 50000, type: 'debit', statut: 'paye' },
      { date: '2026-05-10', libelle: 'Frais de scolarité - Mensualité 1', montant: 50000, type: 'debit', statut: 'paye' },
      { date: '2026-04-01', libelle: 'Frais de scolarité - Mensualité 2', montant: 50000, type: 'debit', statut: 'impaye' },
      { date: '2026-03-15', libelle: 'Frais de bibliothèque', montant: 25000, type: 'debit', statut: 'paye' },
      { date: '2026-02-20', libelle: 'Paiement en ligne', montant: 100000, type: 'credit', statut: 'paye' }
    ];
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
