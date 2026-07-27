import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParentService, Enfant, DashboardData } from '../../services/parent.service';

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
    this.parentService.getEnfants().subscribe({
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
    this.parentService.getDashboard(this.selectedEnfant.apprenantId).subscribe({
      next: (data) => { this.dashboard = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  navigateTo(path: string) {
    if (this.selectedEnfant) {
      this.router.navigate([`/parent/${path}/${this.selectedEnfant.apprenantId}`]);
    }
  }
}
