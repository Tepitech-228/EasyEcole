import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { environment } from 'src/environments/environment';

interface ProchaineEcheance {
  libelle: string;
  montant: number;
  dateLimite: string;
}

interface EcheancesInfo {
  totalImpayees: number;
  enRetard: number;
  prochaineEcheance: ProchaineEcheance | null;
}

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
      next: (u: any) => {
        this.utilisateur = u;
        // Rediriger les étudiants "cours en ligne" vers le Pôle E-Learning
        if (this.rolesValue.isApprenant && u?.apprenant?.periode === 'en_ligne') {
          this.router.navigate(['/pole-elearning']);
        }
      },
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
        label: 'Inscriptions',
        data: demandes.length ? demandes : months.map(() => 0),
        backgroundColor: ['#1769aa', '#1d7bb8', '#258cc0', '#2d9dc7', '#35aebd', '#3bb9a7', '#4bc29b', '#62c88e', '#78cd83', '#8dce7b', '#a5cf75', '#b8cf70'],
        hoverBackgroundColor: '#087f8c',
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }

  get adminDoughnutData(): any {
    const total = this.dashboardData.totalApprenants || 0;
    const ens = this.dashboardData.totalEnseignants || 0;
    const other = Math.max(0, (this.dashboardData.totalPersonnels || 0) - ens);
    return {
      labels: ['Apprenants', 'Enseignants', 'Autres'],
      datasets: [{
        data: [total, ens, other > 0 ? other : 0],
        backgroundColor: ['#3b82f6', '#10b981', '#6366f1'],
        hoverBackgroundColor: ['#2563eb', '#059669', '#4f46e5'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 4,
        hoverOffset: 10,
      }]
    };
  }

  get adminResourcesChartData(): any {
    return {
      labels: ['Apprenants', 'Enseignants', 'Cours', 'Classes'],
      datasets: [{
        label: 'Volume',
        data: [
          this.dashboardData.totalApprenants || 0,
          this.dashboardData.totalEnseignants || 0,
          this.dashboardData.totalCours || 0,
          this.dashboardData.totalClasses || 0,
        ],
        backgroundColor: ['#1769aa', '#087f8c', '#36a38d', '#e0a11a'],
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 22,
      }]
    };
  }

  get adminPriorityChartData(): any {
    return {
      labels: ['Demandes en attente', 'Échéances impayées', 'Sessions ouvertes'],
      datasets: [{
        data: [
          this.dashboardData.demandesEnAttente || 0,
          this.dashboardData.echeancesImpayees || 0,
          this.dashboardData.sessionsOuvertes || 0,
        ],
        backgroundColor: ['#e0a11a', '#dc5a5a', '#087f8c'],
        hoverBackgroundColor: ['#c4870d', '#b94343', '#05636d'],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 10,
      }]
    };
  }

  get adminDemandStatusChartData(): any {
    const demandes = this.dashboardData.recentDemandes || [];
    const validees = demandes.filter((d: any) => d.preInscription?.statut === 'valide').length;
    const rejetees = demandes.filter((d: any) => d.preInscription?.statut === 'rejete').length;
    const enAttente = Math.max(0, demandes.length - validees - rejetees);
    return {
      labels: ['Validées', 'En attente', 'Rejetées'],
      datasets: [{
        data: [validees, enAttente, rejetees],
        backgroundColor: ['#087f8c', '#e0a11a', '#dc5a5a'],
        hoverBackgroundColor: ['#05636d', '#c4870d', '#b94343'],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 10,
      }]
    };
  }

  get adminStudentsByProgramChartData(): any {
    const programmes = this.dashboardData.etudiantsParFiliere || [];
    return {
      labels: programmes.length ? programmes.map((p: any) => p.filiere) : ['Aucune filière'],
      datasets: [{
        label: 'Étudiants',
        data: programmes.length ? programmes.map((p: any) => p.total) : [0],
        backgroundColor: '#1769aa',
        hoverBackgroundColor: '#087f8c',
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 20,
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
        backgroundColor: '#0f172a',
        titleFont: { size: 12, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 14,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter, sans-serif' }, color: '#64748b' }
      },
      y: {
        grid: { color: '#e2e8f0', drawBorder: false },
        beginAtZero: true,
        ticks: {
          font: { size: 11, family: 'Inter, sans-serif' },
          color: '#64748b',
          callback: (value: any) => value.toString()
        }
      }
    },
    elements: { bar: { borderRadius: 8, borderSkipped: false } }
  };

  adminDoughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { animateRotate: true, duration: 1500, easing: 'easeOutQuart' as any },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: 'Inter, sans-serif' },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 14,
        cornerRadius: 12,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0';
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          }
        }
      }
    }
  };

  adminHorizontalBarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    animation: { duration: 1100, easing: 'easeOutQuart' as any },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#10233f',
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: { label: (ctx: any) => ` ${ctx.parsed.x} élément(s)` }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#e6edf3', drawBorder: false },
        ticks: { precision: 0, color: '#64748b', font: { size: 10, family: 'Inter, sans-serif' } }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#334155', font: { size: 11, weight: '600', family: 'Inter, sans-serif' } }
      }
    }
  };

  adminPriorityChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    animation: { animateRotate: true, duration: 1200, easing: 'easeOutQuart' as any },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', color: '#475569', font: { size: 11, family: 'Inter, sans-serif' } }
      },
      tooltip: {
        backgroundColor: '#10233f', padding: 12, cornerRadius: 10,
        callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}` }
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
        borderWidth: 2,
        borderColor: ['#10b981', '#ef4444'],
        hoverOffset: 12,
      }]
    };
  }

  comptableDoughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: { animateRotate: true, duration: 1200, easing: 'easeOutQuart' as any },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: 'Inter, sans-serif' },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 12, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 14,
        cornerRadius: 12,
        displayColors: false
      }
    }
  };

  get comptableBarData(): any {
    return {
      labels: ['Paiements', 'Bordereaux', 'Échéances impayées'],
      datasets: [{
        label: 'Volume',
        data: [
          this.dashboardData.totalPaiements || 0,
          this.dashboardData.totalBordereaux || 0,
          this.dashboardData.echeancesImpayees || 0
        ],
        backgroundColor: ['rgba(14, 165, 233, 0.86)', 'rgba(79, 70, 229, 0.86)', 'rgba(239, 68, 68, 0.86)'],
        borderColor: ['#0ea5e9', '#4f46e5', '#ef4444'],
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false,
      }]
    };
  }

  comptableBarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1100, easing: 'easeOutQuart' as any },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 12, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 14,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter, sans-serif' }, color: '#475569' }
      },
      y: {
        grid: { color: '#e2e8f0' },
        beginAtZero: true,
        ticks: { font: { size: 11, family: 'Inter, sans-serif' }, color: '#475569' }
      }
    }
  };

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
        borderWidth: 2,
        borderColor: ['#f59e0b', '#10b981', '#ef4444'],
        hoverOffset: 12,
      }]
    };
  }

  orientationDoughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { animateRotate: true, duration: 1300, easing: 'easeOutCubic' as any },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 18,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: 'Inter, sans-serif' },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 12, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 14,
        cornerRadius: 12,
        displayColors: false
      }
    }
  };

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
    return Array(count).fill(null).map((_, index) => {
      const alpha = 0.85 - (index * 0.04);
      return start.replace(/0\.85/, alpha.toFixed(2));
    });
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

  // ─── Paiements (Apprenant) ───────────────────────────
  get echeancesInfo(): EcheancesInfo | null {
    const e = this.dashboardData?.echeances;
    if (!e || typeof e !== 'object') return null;
    return {
      totalImpayees: Number(e.totalImpayees) || 0,
      enRetard: Number(e.enRetard) || 0,
      prochaineEcheance: e.prochaineEcheance ?? null
    };
  }

  get paiementAlertState(): 'retard' | 'aVenir' | 'aJour' | null {
    const e = this.echeancesInfo;
    if (!e) return null;
    if (e.enRetard > 0) return 'retard';
    if (e.totalImpayees > 0 && e.prochaineEcheance) return 'aVenir';
    return 'aJour';
  }

  get echeancesEnRetard(): number {
    return this.echeancesInfo?.enRetard ?? 0;
  }

  get prochaineEcheance(): ProchaineEcheance | null {
    return this.echeancesInfo?.prochaineEcheance ?? null;
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
