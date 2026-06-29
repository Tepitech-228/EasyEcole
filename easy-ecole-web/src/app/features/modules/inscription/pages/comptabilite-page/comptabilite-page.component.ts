import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';
import { Compte, JournalComptable, EcritureComptable } from 'src/app/data/modules/comptabilite/models/Comptabilite.model';

@Component({
  selector: 'app-comptabilite-page',
  templateUrl: './comptabilite-page.component.html',
  styleUrls: ['./comptabilite-page.component.scss']
})
export class ComptabilitePageComponent extends BaseComponentClass implements OnInit {

  activeTab: 'plan-comptable' | 'balance' | 'grand-livre' | 'ecritures' = 'plan-comptable'
  
  // Plan comptable
  comptes: Compte[] = []
  comptesParClasse: { [key: string]: Compte[] } = {}
  classesLibelles: { [key: string]: string } = {
    '1': 'Financement permanent',
    '2': 'Actif immobilisé',
    '3': 'Actif circulant',
    '4': 'Passif circulant',
    '5': 'Trésorerie',
    '6': 'Charges',
    '7': 'Revenus',
    '8': 'Comptes spéciaux',
    '9': 'Comptes analytiques'
  }

  // Balance comptable
  balance: any[] = []
  totalDebit = 0
  totalCredit = 0

  // Grand livre
  selectedCompteLivre?: Compte
  grandLivre: any = null

  // Écritures
  ecritures: EcritureComptable[] = []

  loading = false
  error = false

  constructor(
    private comptabiliteService: ComptabiliteService
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadPlanComptable()
  }

  loadPlanComptable(): void {
    this.loading = true
    this.comptabiliteService.getAllComptes().subscribe({
      next: (comptes) => {
        this.comptes = comptes
        this.groupByClasse()
        this.loading = false
      },
      error: (err) => {
        console.error(err)
        this.error = true
        this.loading = false
      }
    })
  }

  groupByClasse(): void {
    this.comptesParClasse = {}
    this.comptes.forEach(compte => {
      if (!this.comptesParClasse[compte.classe]) {
        this.comptesParClasse[compte.classe] = []
      }
      this.comptesParClasse[compte.classe].push(compte)
    })
    // Trier par numéro
    Object.keys(this.comptesParClasse).forEach(classe => {
      this.comptesParClasse[classe].sort((a, b) => a.numero.localeCompare(b.numero))
    })
  }

  loadBalance(): void {
    this.loading = true
    this.comptabiliteService.getBalance().subscribe({
      next: (balance) => {
        this.balance = balance
        this.calculateTotals()
        this.loading = false
      },
      error: (err) => {
        console.error(err)
        this.error = true
        this.loading = false
      }
    })
  }

  calculateTotals(): void {
    this.totalDebit = 0
    this.totalCredit = 0
    this.balance.forEach(item => {
      this.totalDebit += item.debit || 0
      this.totalCredit += item.credit || 0
    })
  }

  loadGrandLivre(compte: Compte): void {
    this.loading = true
    this.selectedCompteLivre = compte
    this.comptabiliteService.getGrandLivre(compte.id!).subscribe({
      next: (data) => {
        this.grandLivre = data
        this.loading = false
      },
      error: (err) => {
        console.error(err)
        this.error = true
        this.loading = false
      }
    })
  }

  onCompteChange(compteId: string): void {
    if (!compteId) {
      this.selectedCompteLivre = undefined;
      this.grandLivre = null;
      return;
    }
    const compte = this.comptes.find(c => c.id === compteId);
    if (compte) {
      this.loadGrandLivre(compte);
    }
  }

  loadEcritures(): void {
    this.loading = true
    this.comptabiliteService.getAllEcritures({ validee: true }).subscribe({
      next: (ecritures) => {
        this.ecritures = ecritures
        this.loading = false
      },
      error: (err) => {
        console.error(err)
        this.error = true
        this.loading = false
      }
    })
  }

  changeTab(tab: 'plan-comptable' | 'balance' | 'grand-livre' | 'ecritures'): void {
    this.activeTab = tab
    if (tab === 'balance' && this.balance.length === 0) {
      this.loadBalance()
    } else if (tab === 'ecritures' && this.ecritures.length === 0) {
      this.loadEcritures()
    }
  }

  getClasseComptes(classe: string): Compte[] {
    return this.comptesParClasse[classe] || []
  }

  getSaldeCompte(compte: Compte): number {
    const item = this.balance.find(b => b.compte.id === compte.id)
    if (!item) return 0
    return (item.debit || 0) - (item.credit || 0)
  }
}

