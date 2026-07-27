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
  demandesEnCours: any[] = [];
  demandesCompletes: any[] = [];
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
    this.loadMesDemandes();
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

  private loadMesDemandes(): void {
    if (!this.rolesValue?.isApprenant) return;
    this.http.get(`${this.API_URL}/inscription/demandesInscription`).subscribe({
      next: (res: any) => {
        const demandes = Array.isArray(res) ? res : (res?.data || []);
        this.demandesCompletes = demandes.filter((d: any) =>
          d.preInscription?.statut === 'valide'
        );
        this.demandesEnCours = demandes.filter((d: any) =>
          d.preInscription?.statut && d.preInscription.statut !== 'valide'
        );
      },
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
    const demandes = this.dashboardData.demandesParMois || [];
    return {
      labels: months,
      datasets: [{
        label: 'Demandes',
        data: demandes.length ? demandes : months.map(() => 0),
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
        data: [total, ens],
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
          this.dashboardData.totalClasses || 0,
          this.dashboardData.totalCours || 0,
          this.dashboardData.totalEnseignants || 0,
          this.dashboardData.totalApprenants || 0
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
          this.dashboardData.totalPaiements || 0,
          this.dashboardData.totalBordereaux || 0,
          this.dashboardData.echeancesImpayees || 0
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
    const total = this.dashboardData.totalEcheances || 0;
    const impayees = this.dashboardData.echeancesImpayees || 0;
    const payees = Math.max(0, total - impayees);
    return {
      labels: ['Échéances payées', 'Échéances impayées'],
      datasets: [{
        data: [payees, impayees],
        backgroundColor: ['#10b981', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    };
  }

  // ─── Orientation Charts ─────────────────────────────────
  get orientationDoughnutData(): any {
    const enAttente = this.dashboardData.enAttente || 0;
    const validees = this.dashboardData.validees || 0;
    const rejetees = this.dashboardData.rejetees || 0;
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
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return {
      labels: jours,
      datasets: [{
        label: 'Cours',
        data: jours.map(() => agenda.length),
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
        labels: ['Aucune note'],
        datasets: [{
          label: 'Notes',
          data: [0],
          backgroundColor: 'rgba(156, 163, 175, 0.5)',
          borderColor: '#9ca3af',
          borderWidth: 1,
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

  get progressionSemestrielle(): any {
    return this.dashboardData.progression || null;
  }

  get semestresProgression(): any[] {
    return this.progressionSemestrielle?.semestres || [];
  }

  get anneeActiveProgression(): string {
    return this.progressionSemestrielle?.anneeActuelle || '';
  }

  get semestreEnCoursProgression(): string | null {
    return this.progressionSemestrielle?.semestreEnCours || null;
  }

  get paiementsRecents(): any[] {
    return this.dashboardData.paiementsRecents || [];
  }

  get demandesRecentes(): any[] {
    return this.dashboardData.demandesRecentes || [];
  }

  // ─── Unified Banner Config ───────────────────────────
  get bannerConfig(): { title: string; subtitle: string; avatar: boolean } {
    const { isAdmin, isInstitution, isEnseignant, isApprenant, isRessourcesHumaines, isCaissierBanque, isCabinetComptable, isComiteOrientation } = this.rolesValue;
    const prenoms = this.utilisateur?.prenoms || '';
    const year = this.currentYear;

    if (isAdmin) return {
      title: `Bonjour ${prenoms || 'Admin'}`,
      subtitle: `${year} · Aperçu général de l'établissement`,
      avatar: false
    };
    if (isInstitution) return {
      title: `Bonjour ${prenoms || 'Directeur'}`,
      subtitle: `${year} · Pilotage de l'établissement`,
      avatar: false
    };
    if (isEnseignant) return {
      title: `Bonjour ${prenoms || 'Professeur'}`,
      subtitle: `${year} · Aperçu de votre journée`,
      avatar: false
    };
    if (isApprenant) return {
      title: `Bonjour ${prenoms || 'Étudiant'}`,
      subtitle: `${year} · Vue d'ensemble de votre scolarité`,
      avatar: true
    };
    if (isRessourcesHumaines) return {
      title: `Bonjour ${prenoms || 'RH'}`,
      subtitle: `${year} · Gestion du personnel`,
      avatar: false
    };
    if (isCaissierBanque) return {
      title: `Bonjour ${prenoms || 'Caissier'}`,
      subtitle: `${year} · Caisse et encaissements`,
      avatar: false
    };
    if (isCabinetComptable) return {
      title: `Bonjour ${prenoms || 'Comptable'}`,
      subtitle: `${year} · Finance et comptabilité`,
      avatar: false
    };
    if (isComiteOrientation) return {
      title: `Bonjour ${prenoms || 'Orientation'}`,
      subtitle: `${year} · Suivi des inscriptions`,
      avatar: false
    };
    return {
      title: `Bonjour ${prenoms || 'Utilisateur'}`,
      subtitle: `${year}`,
      avatar: false
    };
  }

  // ─── Banner Background CSS ──────────────────────────
  get bannerBackground(): string {
    const { isAdmin, isInstitution, isEnseignant, isApprenant, isRessourcesHumaines, isCaissierBanque, isCabinetComptable, isComiteOrientation } = this.rolesValue;

    if (isAdmin)       return 'linear-gradient(135deg, #2563eb, #1d4ed8, #3730a3)';
    if (isInstitution) return 'linear-gradient(135deg, #7c3aed, #6d28d9, #581c87)';
    if (isEnseignant)  return 'linear-gradient(135deg, #059669, #047857, #0f766e)';
    if (isApprenant)   return 'linear-gradient(135deg, #f59e0b, #ea580c, #be123c)';
    if (isRessourcesHumaines) return 'linear-gradient(135deg, #db2777, #be185d, #9d174d)';
    if (isCaissierBanque)     return 'linear-gradient(135deg, #16a34a, #15803d, #065f46)';
    if (isCabinetComptable)   return 'linear-gradient(135deg, #0891b2, #0e7490, #1e40af)';
    if (isComiteOrientation)  return 'linear-gradient(135deg, #4f46e5, #4338ca, #1e40af)';
    return 'linear-gradient(135deg, #374151, #111827)';
  }
}
