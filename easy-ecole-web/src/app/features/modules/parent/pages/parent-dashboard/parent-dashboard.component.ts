import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParentService, Enfant, DashboardData } from '../../services/parent.service';
import { untilDestroyed } from 'src/app/core/utils/take-until-destroy';

@Component({
  selector: 'app-parent-dashboard',
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss']
})
export class ParentDashboardComponent implements OnInit {
  enfants: Enfant[] = [];
  selectedEnfant: Enfant | null = null;
  dashboard: DashboardData | null = null;
  loading = false;

  constructor(private parentService: ParentService, private router: Router) {}

  ngOnInit(): void {
    this.loadEnfants();
  }

  loadEnfants() {
    this.parentService.getEnfants().pipe(untilDestroyed(this)).subscribe({
      next: (list) => {
        this.enfants = list;
        if (list.length > 0) {
          this.selectedEnfant = list[0];
          this.loadDashboard();
        }
      }
    });
  }

  selectEnfant(enfant: Enfant) {
    this.selectedEnfant = enfant;
    this.loadDashboard();
  }

  loadDashboard() {
    if (!this.selectedEnfant) return;
    this.loading = true;
    this.parentService.getDashboard(this.selectedEnfant.apprenantId).pipe(untilDestroyed(this)).subscribe({
      next: (data) => { this.dashboard = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  navigateTo(path: string) {
    if (this.selectedEnfant) {
      this.router.navigate([`/parent/${path}/${this.selectedEnfant.apprenantId}`]);
    }
  }

  get echeances(): { libelle: string; montant: number; dateEcheance: string; paye: boolean }[] {
    return this.dashboard?.echeances || [];
  }

  get echeancesPayload(): any {
    const list = this.echeances;
    const payees = list.filter(e => e.paye).length;
    const impayees = list.filter(e => !e.paye).length;
    return {
      type: 'doughnut',
      labels: ['Payées', 'Impayées'],
      datasets: [{ label: 'Échéances', data: [payees, impayees] }],
      colors: ['#10b981', '#ef4444']
    };
  }

  get echeancesMontantsPayload(): any {
    const list = this.echeances;
    const payees = list.map(e => (e.paye ? e.montant : 0));
    const impayees = list.map(e => (e.paye ? 0 : e.montant));
    return {
      type: 'horizontalBar',
      labels: list.map(e => e.libelle),
      datasets: [
        { label: 'Payé', data: payees },
        { label: 'Impayé', data: impayees }
      ],
      colors: ['#10b981', '#ef4444']
    };
  }
}
