import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageService } from '../../services/rattrapage.service';

@Component({
  selector: 'app-liste-rattrapages-page',
  templateUrl: './liste-rattrapages-page.component.html',
  styleUrls: ['./liste-rattrapages-page.component.scss']
})
export class ListeRattrapagesPageComponent extends BaseComponentClass implements OnInit {
  inscriptions: any[] = [];
  sessions: any[] = [];
  stats: any = null;
  loading = false;
  selectedSessionId: number | null = null;
  showAssignModal = false;
  assignForm = { sessionExamenId: null as number | null, classeId: null as number | null, semestre: '' as string, anneeAcademiqueId: null as number | null };

  constructor(
    private service: RattrapageService,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.service.getSessions().subscribe({
      next: (sessions) => { this.sessions = sessions; this.loading = false; this.loadAll(); },
      error: () => { this.loading = false; }
    });
  }

  loadAll(): void {
    this.loading = true;
    const params: any = {};
    if (this.selectedSessionId) params.sessionExamenId = this.selectedSessionId;
    this.service.getAll(params).subscribe({
      next: (res) => { this.inscriptions = res; this.loading = false; this.loadStats(); },
      error: () => { this.loading = false; }
    });
  }

  loadStats(): void {
    const params: any = {};
    if (this.selectedSessionId) params.sessionExamenId = this.selectedSessionId;
    this.service.getStats(params).subscribe({
      next: (res) => { this.stats = res; }
    });
  }

  onSessionChange(sessionId: number | string): void {
    this.selectedSessionId = sessionId ? Number(sessionId) : null;
    this.loadAll();
  }

  openAssignModal(): void {
    this.assignForm = { sessionExamenId: null, classeId: null, semestre: '', anneeAcademiqueId: null };
    this.showAssignModal = true;
  }

  submitAssign(): void {
    this.service.assignerAuto(this.assignForm).subscribe({
      next: (res) => { this.showAssignModal = false; this.loadAll(); },
      error: (err) => { console.error(err); }
    });
  }

  notifierTous(): void {
    const ids = this.inscriptions.map(i => i.id);
    if (!ids.length) return;
    this.service.notifierEtudiants(ids).subscribe({
      next: () => { this.loadAll(); }
    });
  }

  notifierNonEnvoyes(): void {
    const ids = this.inscriptions.filter(i => !i.notificationEnvoyee).map(i => i.id);
    if (!ids.length) return;
    this.service.notifierEtudiants(ids).subscribe({
      next: () => { this.loadAll(); }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.service.delete(id).subscribe(() => {
      this.inscriptions = this.inscriptions.filter(i => i.id !== id);
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
