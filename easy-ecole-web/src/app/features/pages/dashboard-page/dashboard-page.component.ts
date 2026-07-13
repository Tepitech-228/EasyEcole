import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent extends BaseComponentClass implements OnInit {
  currentYear = new Date().getFullYear();
  loading = true;
  utilisateur: any = null;
  dashboardData: any = {};
  sessions: any[] = [];
  currentSession = 0;
  showNouvelleDemandeModal = false;
  alreadySignUp = false;
  demandeError = false;

  readonly PHOTOS_PATH = environment.MEDIAS_PATH.AUTH.PHOTOS;
  readonly QR_CODES_PATH = environment.QR_CODES_PATH;
  readonly API_URL = environment.API_URL;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { super(); }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadSessions();
    this.loadUserInfo();
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

  private loadSessions(): void {
    this.http.get(`${this.API_URL}/inscription/sessions`).subscribe({
      next: (res: any) => {
        this.sessions = (Array.isArray(res) ? res : []).filter(
          (s: any) => Session.getEtat(s.dateDebut, s.dateFin) === EtatsSession.OUVERTE
        );
      },
      error: () => {}
    });
  }

  private loadUserInfo(): void {
    this.http.get(`${this.API_URL}/auth/utilisateurs/moi`).subscribe({
      next: (u: any) => this.utilisateur = u,
      error: () => {}
    });
  }

  faireDemandeInscription(): void {
    if (!this.sessions.length) return;
    const body = { dateDemande: new Date(), sessionId: this.sessions[this.currentSession].id };
    this.http.post(`${this.API_URL}/inscription/demandesInscription`, body).subscribe({
      next: (res: any) => this.router.navigate(['/inscription/demandes', res.id]),
      error: (err: HttpErrorResponse) => {
        if (err.error?.alreadySignUp) {
          this.alreadySignUp = true;
          setTimeout(() => this.alreadySignUp = false, 3000);
        } else {
          this.demandeError = true;
          setTimeout(() => this.demandeError = false, 3000);
        }
      }
    });
  }

  getEtatSession(d: Date, f: Date): EtatsSession {
    return Session.getEtat(d, f);
  }

  scrollCarousel(dir: number): void {
    const max = this.sessions.length - 1;
    this.currentSession = Math.max(0, Math.min(max, this.currentSession + dir));
  }

  // ─── Admin Charts ──────────────────────────────────────
  get adminBarChartData(): any {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const defaultData = [8, 12, 6, 15, 20, 18, 10, 5, 14, 22, 17, 9];
    return {
      labels: months,
      datasets: [{
        label: 'Demandes',
        data: defaultData,
        backgroundColor: this.createGradient('rgba(59, 130, 246, 0.85)', 'rgba(59, 130, 246, 0.25)', 12),
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }

  get adminDoughnutData(): any {
    const total = this.dashboardData.totalApprenants || 0;
    const ens = this.dashboardData.totalEnseignants || 0;
    return {
      labels: ['Apprenants', 'Enseignants'],
      datasets: [{
        data: [total || 180, ens || 45],
        backgroundColor: ['#3b82f6', '#10b981'],
        hoverBackgroundColor: ['#2563eb', '#059669'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    };
  }

  adminBarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeOutQuart' as any },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: 'Inter, sans-serif' }, color: '#94a3b8' }
      },
      y: {
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: { font: { size: 10, family: 'Inter, sans-serif' }, color: '#94a3b8', stepSize: 5 }
      }
    }
  };

  adminDoughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { animateRotate: true, duration: 1500, easing: 'easeOutQuart' as any },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 12, family: 'Inter, sans-serif' } }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          }
        }
      }
    }
  };

  // ─── Institution Charts ────────────────────────────────
  get institutionBarData(): any {
    return {
      labels: ['Classes', 'Cours', 'Enseignants', 'Apprenants'],
      datasets: [{
        label: 'Effectifs',
        data: [
          this.dashboardData.totalClasses || 12,
          this.dashboardData.totalCours || 48,
          this.dashboardData.totalEnseignants || 45,
          this.dashboardData.totalApprenants || 180
        ],
        backgroundColor: [
          'rgba(139, 92, 246, 0.85)', 'rgba(59, 130, 246, 0.85)',
          'rgba(16, 185, 129, 0.85)', 'rgba(245, 158, 11, 0.85)'
        ],
        borderColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }

  institutionBarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutBounce' as any },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12, cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y} ${ctx.label}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, beginAtZero: true, ticks: { stepSize: 20 } }
    }
  };

  // ─── Caissier Charts ────────────────────────────────────
  get caissierBarData(): any {
    return {
      labels: ['Paiements', 'Bordereaux', 'Échéances impayées'],
      datasets: [{
        label: 'Volume',
        data: [
          this.dashboardData.totalPaiements || 240,
          this.dashboardData.totalBordereaux || 180,
          this.dashboardData.echeancesImpayees || 35
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.85)', 'rgba(59, 130, 246, 0.85)', 'rgba(239, 68, 68, 0.85)'
        ],
        borderColor: ['#10b981', '#3b82f6', '#ef4444'],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }

  caissierBarOptions: any = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutBounce' as any },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b', padding: 12, cornerRadius: 10,
        callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} ` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
    }
  };

  // ─── Comptable Charts ──────────────────────────────────
  get comptableDoughnutData(): any {
    const total = this.dashboardData.totalEcheances || 250;
    const impayees = this.dashboardData.echeancesImpayees || 35;
    const payees = total - impayees;
    return {
      labels: ['Échéances payées', 'Échéances impayées'],
      datasets: [{
        data: [payees || 215, impayees || 35],
        backgroundColor: ['#10b981', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    };
  }

  // ─── Orientation Charts ─────────────────────────────────
  get orientationDoughnutData(): any {
    const enAttente = this.dashboardData.enAttente || 28;
    const validees = this.dashboardData.validees || 62;
    const rejetees = this.dashboardData.rejetees || 10;
    return {
      labels: ['En attente', 'Validées', 'Rejetées'],
      datasets: [{
        data: [enAttente, validees, rejetees],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
        hoverBackgroundColor: ['#d97706', '#059669', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    };
  }

  // ─── Enseignant Charts ─────────────────────────────────
  get enseignantBarData(): any {
    const agenda = this.dashboardData.agenda || [];
    return {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      datasets: [{
        label: 'Cours',
        data: [3, 5, 2, 4, 1, 0].map((v, i) => v + (i === new Date().getDay() - 1 ? agenda.length * 0.5 : 0)),
        backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(16, 185, 129, 0.7)', 'rgba(16, 185, 129, 0.85)', 'rgba(16, 185, 129, 0.7)', 'rgba(16, 185, 129, 0.85)', 'rgba(16, 185, 129, 0.3)'],
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }

  enseignantBarOptions: any = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutQuart' as any },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 10, displayColors: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      y: { grid: { color: '#f1f5f9', drawBorder: false }, beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 }, color: '#94a3b8' } }
    }
  };

  get enseignantDoughnutData(): any {
    const aSaisir = this.dashboardData.notesASaisir?.length || 0;
    const saisies = Math.max(8 - aSaisir, 0);
    return {
      labels: ['Notes saisies', 'Notes à saisir'],
      datasets: [{
        data: [saisies || 5, aSaisir || 3],
        backgroundColor: ['#10b981', '#f59e0b'],
        hoverBackgroundColor: ['#059669', '#d97706'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    };
  }

  // ─── Apprenant Charts ─────────────────────────────────
  get apprenantBarData(): any {
    const notes = this.dashboardData.notesRecentes || [];
    const labels = notes.slice(0, 8).map((n: any) => n.cours?.substring(0, 10) || 'Matière');
    const data = notes.slice(0, 8).map((n: any) => n.note || 0);
    if (labels.length === 0) {
      return {
        labels: ['Maths', 'Info', 'Anglais', 'Compta', 'Droit', 'Marketing', 'BD', 'Réseaux'],
        datasets: [{
          label: 'Notes',
          data: [14, 16, 12, 15, 13, 17, 14, 11],
          backgroundColor: 'rgba(245, 158, 11, 0.85)',
          borderColor: '#f59e0b',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      };
    }
    return {
      labels,
      datasets: [{
        label: 'Notes /20',
        data,
        backgroundColor: data.map((v: number) => v >= 10 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)'),
        borderColor: data.map((v: number) => v >= 10 ? '#10b981' : '#ef4444'),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }

  apprenantBarOptions: any = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeOutQuart' as any },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b', padding: 12, cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y}/20`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
      y: { grid: { color: '#f1f5f9', drawBorder: false }, min: 0, max: 20, ticks: { stepSize: 5, font: { size: 10 }, color: '#94a3b8' } }
    }
  };

  get apprenantDoughnutData(): any {
    return {
      labels: ['Présent', 'Absent', 'Justifié'],
      datasets: [{
        data: [38, 7, 3],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        hoverBackgroundColor: ['#059669', '#dc2626', '#d97706'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    };
  }

  // ─── Helpers ───────────────────────────────────────────
  private createGradient(start: string, end: string, count: number): string[] {
    return Array(count).fill(null).map(() => start);
  }

  get total(): number {
    return (this.dashboardData.totalApprenants || 0) + (this.dashboardData.totalEnseignants || 0);
  }

  get recentDemandes(): any[] {
    return this.dashboardData.recentDemandes || [];
  }

  get paiementsRecents(): any[] {
    return this.dashboardData.paiementsRecents || [];
  }

  get demandesRecentes(): any[] {
    return this.dashboardData.demandesRecentes || [];
  }
}
