import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pole-elearning-home',
  templateUrl: './pole-elearning-home.component.html',
  styleUrls: ['./pole-elearning-home.component.scss']
})
export class PoleElearningHomeComponent extends BaseComponentClass implements OnInit {
  currentYear = new Date().getFullYear();
  loading = true;
  utilisateur: any = null;
  dashboardData: any = {};

  readonly API_URL = environment.API_URL;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { super(); }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDashboard();
  }

  private loadUserInfo(): void {
    this.http.get(`${this.API_URL}/auth/utilisateurs/moi`).subscribe({
      next: (u: any) => this.utilisateur = u,
      error: () => {}
    });
  }

  private loadDashboard(): void {
    this.loading = true;
    this.http.get(`${this.API_URL}/inscription/dashboard`).subscribe({
      next: (res: any) => {
        this.dashboardData = res?.data || {};
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get prenom(): string {
    return this.utilisateur?.prenoms || 'Etudiant';
  }

  get bannerConfig(): { title: string; subtitle: string } {
    return {
      title: `Bonjour ${this.prenom}`,
      subtitle: `${this.currentYear} · Votre espace Cours en Ligne`
    };
  }

  get modules(): { icon: string; label: string; description: string; route: string; color: string }[] {
    return [
      {
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        label: 'Mes Cours',
        description: 'Acceder a vos cours en ligne, videos et supports',
        route: '/elearning/dashboard',
        color: '#14B8A6'
      },
      {
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        label: 'Evaluations',
        description: 'Quiz, devoirs et examens a passer',
        route: '/elearning/devoirs',
        color: '#8B5CF6'
      },
      {
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        label: 'Progression',
        description: 'Suivre votre avancement dans les matieres',
        route: '/elearning/progression',
        color: '#F59E0B'
      },
      {
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        label: 'Forum',
        description: 'Echanger avec vos camarades et enseignants',
        route: '/elearning/dashboard',
        color: '#3B82F6'
      },
      {
        icon: 'M3 817.498V19a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zm15 3h4a2 2 0 012 2v10a2 2 0 01-2 2h-4a2 2 0 01-2-2v-10a2 2 0 012-2z',
        label: 'Messages',
        description: 'Messagerie privee avec vos enseignants',
        route: '/elearning/dashboard',
        color: '#EC4899'
      },
      {
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        label: 'Certificats',
        description: 'Vos attestations et certificats obtenus',
        route: '/elearning/certificats',
        color: '#10B981'
      }
    ];
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
