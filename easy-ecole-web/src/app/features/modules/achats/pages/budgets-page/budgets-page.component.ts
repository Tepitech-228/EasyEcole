import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BudgetService } from 'src/app/data/modules/achats/services/budget.service';
import { Budget } from 'src/app/data/modules/achats/models/achats.models';

@Component({
  selector: 'app-budgets-page',
  templateUrl: './budgets-page.component.html',
  styleUrls: ['./budgets-page.component.scss']
})
export class BudgetsPageComponent extends BaseComponentClass implements OnInit {
  budgets: any[] = []
  loading = false

  constructor(private budgetService: BudgetService) { super() }

  ngOnInit(): void {
    this.loadBudgets()
  }

  loadBudgets() {
    this.loading = true
    this.budgetService.getAll().subscribe({
      next: (items: Budget[]) => {
        this.budgets = items.map(b => ({
          id: b.id,
          departement: b.departement?.nom || '—',
          periode: b.periode,
          alloue: Number(b.montantAlloue) || 0,
          utilise: Number(b.montantUtilise) || 0,
        }))
        this.loading = false
      },
      error: () => {
        this.budgets = []
        this.loading = false
      }
    })
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
