import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { RhEmploye } from 'src/app/data/modules/rh/models/RhEmploye.model';

export const EMPLOYE_STATUTS: string[] = ['actif', 'suspendu', 'quitté'];

@Component({
  selector: 'app-employe-details-page',
  templateUrl: './employe-details-page.component.html',
  styleUrls: ['./employe-details-page.component.scss']
})
export class EmployeDetailsPageComponent extends BaseComponentClass implements OnInit {
  employeId: string | null = null;
  employe: RhEmploye | null = null;
  loading = false;
  notFound = false;
  errorMessage: string | null = null;
  activeTab: 'contrats' | 'bulletins' | 'conge' = 'contrats';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeService: RhEmployeService
  ) { super() }

  ngOnInit(): void {
    this.employeId = this.route.snapshot.paramMap.get('id');
    if (this.employeId) {
      this.loadEmploye();
    } else {
      this.notFound = true;
    }
  }

  private loadEmploye(): void {
    this.loading = true;
    this.notFound = false;
    this.errorMessage = null;
    this.employeService.get(this.employeId!).subscribe({
      next: (data) => {
        this.employe = data as RhEmploye;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notFound = true;
        this.errorMessage = err.error?.message || 'Impossible de charger cet employé.';
      }
    });
  }

  getStatutBadge(statut?: string): string {
    const map: Record<string, string> = {
      actif: 'bg-green-100 text-green-700',
      suspendu: 'bg-red-100 text-red-700',
      quitte: 'bg-yellow-100 text-yellow-700'
    };
    return map[statut || ''] || 'bg-gray-100 text-gray-700';
  }

  goBack(): void {
    this.router.navigate(['/rh/employes']);
  }

  setTab(tab: 'contrats' | 'bulletins' | 'conge'): void {
    this.activeTab = tab;
  }
}
