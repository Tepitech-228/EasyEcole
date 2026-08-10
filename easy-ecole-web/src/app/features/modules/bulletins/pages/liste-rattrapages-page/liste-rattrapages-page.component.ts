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

  activeTab: 'auto' | 'demandes' = this.rolesValue.isApprenant ? 'demandes' : 'auto';
  demandesEtudiant: any[] = [];
  loadingDemandes = false;
  showProgrammeModal = false;
  selectedDemande: any = null;
  programmeForm = { dateRattrapage: '' as string, heureDebut: '' as string, heureFin: '' as string, salle: '' as string, enseignantId: null as number | null };
  enseignants: any[] = [];
  paysantId: number | null = null;

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

    if (!this.rolesValue.isApprenant) {
      this.loadDemandesEtudiant();
      this.loadEnseignants();
    }
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

  loadDemandesEtudiant(): void {
    this.loadingDemandes = true;
    this.service.getDemandes().subscribe({
      next: (res) => { this.demandesEtudiant = res; this.loadingDemandes = false; },
      error: () => { this.demandesEtudiant = []; this.loadingDemandes = false; }
    });
  }

  loadEnseignants(): void {
    this.service.getEnseignantsDisponibles().subscribe({
      next: (res) => { this.enseignants = res; },
      error: () => { this.enseignants = []; }
    });
  }

  openProgrammeModal(demande: any): void {
    this.selectedDemande = demande;
    this.programmeForm = {
      dateRattrapage: '',
      heureDebut: '',
      heureFin: '',
      salle: '',
      enseignantId: demande.enseignantId || null
    };
    this.showProgrammeModal = true;
  }

  submitProgramme(): void {
    if (!this.selectedDemande) return;
    this.service.programmer(this.selectedDemande.id, this.programmeForm).subscribe({
      next: () => {
        this.showProgrammeModal = false;
        this.selectedDemande = null;
        this.loadDemandesEtudiant();
      },
      error: (err) => { console.error(err); }
    });
  }

  confirmerPaiement(demande: any): void {
    this.paysantId = demande.id;
    this.service.confirmerPaiement(demande.id, demande.paiementId).subscribe({
      next: () => {
        this.paysantId = null;
        this.loadDemandesEtudiant();
      },
      error: (err) => { console.error(err); this.paysantId = null; }
    });
  }

  confirmerPaiementAuto(demande: any): void {
    this.paysantId = demande.id;
    this.service.confirmerPaiementAuto(demande.id).subscribe({
      next: () => {
        this.paysantId = null;
        this.loadDemandesEtudiant();
      },
      error: (err) => { console.error(err); this.paysantId = null; }
    });
  }
}
