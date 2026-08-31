import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { untilDestroyed } from 'src/app/core/utils/take-until-destroy';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-dashboard-rh-page',
  templateUrl: './dashboard-rh-page.component.html',
  styleUrls: ['./dashboard-rh-page.component.scss']
})
export class DashboardRhPageComponent extends BaseComponentClass implements OnInit {
  stats = [
    { label: 'Employés', value: '--', icon: 'people', color: 'blue', link: '/rh/employes' },
    { label: 'Bulletins', value: '--', icon: 'receipt_long', color: 'green', link: '/rh/paie' },
    { label: 'Candidatures', value: '--', icon: 'person_add', color: 'yellow', link: '/rh/candidatures' },
    { label: 'Formations', value: '--', icon: 'school', color: 'purple', link: '/rh/formations' },
  ];
  quickLinks = [
    { label: 'Gérer les employés', desc: 'Ajouter, modifier ou consulter', link: '/rh/employes', icon: 'people' },
    { label: 'Offres d\'emploi', desc: 'Publier et gérer les offres', link: '/rh/offres-emploi', icon: 'work' },
    { label: 'Candidatures', desc: 'Suivre les candidatures', link: '/rh/candidatures', icon: 'inbox' },
    { label: 'Paie', desc: 'Gérer bulletins et périodes', link: '/rh/paie', icon: 'payments' },
  ];
  recentActivities: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  departementPayload: any = null;
  statutPayload: any = null;

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) { super() }

  ngOnInit(): void {
    this.loadDashboard()
  }

  loadDashboard() {
    this.loading = true
    this.error = null
    this.http.get(`${environment.API_URL}/rh/dashboard`).pipe(untilDestroyed(this)).subscribe({
      next: (res: any) => {
        if (res?.data?.totalEmployes) this.stats[0].value = String(res.data.totalEmployes);
        if (res?.data?.totalBulletins) this.stats[1].value = String(res.data.totalBulletins);
        if (res?.data?.totalCandidatures) this.stats[2].value = String(res.data.totalCandidatures);
        if (res?.data?.totalFormations) this.stats[3].value = String(res.data.totalFormations);
        this.recentActivities = res?.data?.recentActivities || [];

        const charts = res?.data?.charts || {};
        const parDepartement = charts.employesParDepartement || [];
        if (parDepartement.length) {
          this.departementPayload = {
            type: 'bar',
            labels: parDepartement.map((d: any) => d.departement),
            datasets: [{ label: 'Employés', data: parDepartement.map((d: any) => d.total) }]
          };
        }
        const parStatut = charts.employesParStatut || [];
        if (parStatut.length) {
          this.statutPayload = {
            type: 'doughnut',
            labels: parStatut.map((s: any) => s.statut),
            datasets: [{ label: 'Employés', data: parStatut.map((s: any) => s.total) }]
          };
        }
        
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.error = err.error?.message || 'Erreur lors du chargement'
        if (this.error) {
          this.toastService.error(this.error)
        }
      }
    });
  }
}
