import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard-rh-page',
  templateUrl: './dashboard-rh-page.component.html',
  styleUrls: ['./dashboard-rh-page.component.scss']
})
export class DashboardRhPageComponent extends BaseComponentClass implements OnInit {
  stats = [
    { label: 'Employés', value: '--', icon: 'people', color: 'blue', link: '/rh/employes' },
    { label: 'Offres d\'emploi', value: '--', icon: 'work', color: 'green', link: '/rh/offres-emploi' },
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

  constructor(private http: HttpClient) { super() }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard() {
    this.http.get(`${environment.API_URL}/rh/dashboard`).subscribe({
      next: (res: any) => {
        if (res?.data?.totalEmployes) this.stats[0].value = String(res.data.totalEmployes);
        this.recentActivities = res?.data?.recentActivities || [];
      },
      error: () => {}
    });
  }
}
