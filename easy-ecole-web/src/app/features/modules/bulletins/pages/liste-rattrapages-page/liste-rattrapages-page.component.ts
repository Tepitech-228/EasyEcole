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

  activeTab: 'auto' | 'demandes' = this.rolesValue.isApprenant ? 'demandes' : 'auto';
  demandesEtudiant: any[] = [];
  loadingDemandes = false;
  showProgrammeModal = false;
  selectedDemande: any = null;
  programmeForm = { dateRattrapage: '' as string, heureDebut: '' as string, heureFin: '' as string, salle: '' as string, enseignantId: null as number | null };
  enseignants: any[] = [];
  paysantId: number | null = null;

  // Saisie des notes (correcteur désigné par l'institution)
  showNotesModal = false;
  notesSaisie: any[] = [];
  notesError: string | null = null;
  notesSaving = false;

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

    // Présélection du correcteur désigné pour ce cours lors de la création de la session
    if (demande.sessionExamenId && demande.coursId) {
      this.service.getCorrecteursSession(demande.sessionExamenId).subscribe({
        next: (correcteurs: any[]) => {
          const c = (correcteurs || []).find((x: any) => String(x.coursId) === String(demande.coursId));
          if (c && !this.programmeForm.enseignantId) {
            this.programmeForm.enseignantId = c.enseignantId;
          }
        },
        error: () => {}
      });
    }
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

  openNotesModal(): void {
    this.notesError = null;
    this.notesSaisie = this.inscriptions.map(i => ({ id: i.id, noteRattrapage: i.noteRattrapage ?? null }));
    this.showNotesModal = true;
  }

  submitNotes(): void {
    this.notesError = null;
    this.notesSaving = true;
    this.service.saveNotes(this.notesSaisie).subscribe({
      next: () => {
        this.notesSaving = false;
        this.showNotesModal = false;
        this.loadAll();
      },
      error: (err) => {
        this.notesSaving = false;
        this.notesError = err.error?.message || 'Erreur lors de la saisie des notes.';
      }
    });
  }
}
