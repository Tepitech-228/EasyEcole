import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard-admin-page',
  templateUrl: './dashboard-admin-page.component.html',
  styleUrls: ['./dashboard-admin-page.component.scss']
})
export class DashboardAdminPageComponent extends BaseComponentClass implements OnInit {
  stats = [
    { label: 'Utilisateurs', value: '--', icon: 'people', color: 'blue', link: '/administration/utilisateurs' },
    { label: 'Rôles', value: '--', icon: 'admin_panel_settings', color: 'indigo', link: '/administration/roles' },
    { label: 'Audit', value: '--', icon: 'history', color: 'green', link: '/administration/audit-logs' },
    { label: 'Modules', value: '--', icon: 'widgets', color: 'purple', link: '/administration/configuration' },
  ];
  quickLinks = [
    { label: 'Gérer les utilisateurs', desc: 'Créer, modifier, assigner les rôles', link: '/administration/utilisateurs', icon: 'people' },
    { label: 'Gérer les rôles', desc: 'Permissions et utilisateurs par rôle', link: '/administration/roles', icon: 'admin_panel_settings' },
    { label: 'Journal d\'audit', desc: 'Historique des actions système', link: '/administration/audit-logs', icon: 'history' },
    { label: 'Configuration', desc: 'Paramètres généraux du système', link: '/administration/configuration', icon: 'settings' },
  ];
  recentActivities: any[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) { super() }

  ngOnInit(): void {
    this.loadDashboard()
  }

  loadDashboard(): void {
    this.loading = true
    this.error = null
    this.http.get(`${environment.API_URL}/administration/dashboard`).subscribe({
      next: (res: any) => {
        if (res?.data?.totalUtilisateurs) this.stats[0].value = String(res.data.totalUtilisateurs)
        if (res?.data?.totalRoles) this.stats[1].value = String(res.data.totalRoles)
        if (res?.data?.totalAudits) this.stats[2].value = String(res.data.totalAudits)
        if (res?.data?.modulesActifs) this.stats[3].value = String(res.data.modulesActifs)
        this.recentActivities = res?.data?.recentActivities || []
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.error = err.error?.message || 'Erreur lors du chargement'
        if (this.error) {
          this.toastService.error(this.error)
        }
      }
    })
  }
}
