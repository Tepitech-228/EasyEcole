import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-budgets-page',
  templateUrl: './budgets-page.component.html',
  styleUrls: ['./budgets-page.component.scss']
})
export class BudgetsPageComponent extends BaseComponentClass implements OnInit {
  budgets: any[] = []
  loading = false

  constructor() { super() }

  ngOnInit(): void {
    this.loadBudgets()
  }

  loadBudgets() {
    this.loading = true
    setTimeout(() => {
      this.budgets = [
        { id: 1, departement: 'Informatique', periode: '2026-Q1', alloue: 5000000, utilise: 3200000 },
        { id: 2, departement: 'Ressources Humaines', periode: '2026-Q1', alloue: 2000000, utilise: 1500000 },
        { id: 3, departement: 'Logistique', periode: '2026-Q1', alloue: 3000000, utilise: 2800000 },
      ]
      this.loading = false
    }, 500)
  }

  get totalAlloue(): number {
    return this.budgets.reduce((s, b) => s + (b.alloue || 0), 0)
  }

  get totalUtilise(): number {
    return this.budgets.reduce((s, b) => s + (b.utilise || 0), 0)
  }

  get ecartGlobal(): number {
    return this.totalAlloue - this.totalUtilise
  }
}
