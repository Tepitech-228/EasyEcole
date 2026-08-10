import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageService } from '../../services/rattrapage.service';
import { SuiviUeService } from 'src/app/data/modules/inscription/services/suivi-ue.service';

@Component({
  selector: 'app-mes-rattrapages-page',
  templateUrl: './mes-rattrapages-page.component.html',
  styleUrls: ['./mes-rattrapages-page.component.scss']
})
export class MesRattrapagesPageComponent extends BaseComponentClass implements OnInit {
  failedModules: any[] = [];
  mesDemandes: any[] = [];
  sessions: any[] = [];
  loading = true;
  loadingDemandes = false;
  error: string | null = null;
  success: string | null = null;

  showDemandeModal = false;
  demandeForm = {
    coursId: null as number | null,
    sessionExamenId: null as number | null,
    coursParticipantId: null as number | null,
    motifEtudiant: '',
    creneauSouhaite: ''
  };

  payingId: number | null = null;

  constructor(
    private rattrapageService: RattrapageService,
    private suiviUeService: SuiviUeService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadSessions();
    this.loadFailedModules();
    this.loadMesDemandes();
  }

  loadSessions(): void {
    this.rattrapageService.getSessions().subscribe({
      next: (sessions) => { this.sessions = sessions.filter((s: any) => s.type === 'rattrapage'); },
      error: () => {}
    });
  }

  loadFailedModules(): void {
    this.loading = true;
    this.suiviUeService.getMonSuivi().subscribe({
      next: (data: any) => {
        const ues = data?.ues || [];
        this.failedModules = ues.filter((ue: any) =>
          (ue.moyenne != null && ue.moyenne < 10) || ue.statut === 'dette_active'
        );
        this.loading = false;
      },
      error: () => {
        this.failedModules = [];
        this.loading = false;
      }
    });
  }

  loadMesDemandes(): void {
    this.loadingDemandes = true;
    this.rattrapageService.getMesDemandes().subscribe({
      next: (data) => { this.mesDemandes = data; this.loadingDemandes = false; },
      error: () => { this.mesDemandes = []; this.loadingDemandes = false; }
    });
  }

  openDemandeModal(module: any): void {
    this.demandeForm = {
      coursId: module.coursId || module.id,
      sessionExamenId: null,
      coursParticipantId: null,
      motifEtudiant: '',
      creneauSouhaite: ''
    };
    this.showDemandeModal = true;
  }

  submitDemande(): void {
    if (!this.demandeForm.coursId) return;
    this.error = null;
    this.success = null;
    this.rattrapageService.creerDemande(this.demandeForm).subscribe({
      next: () => {
        this.success = 'Demande de rattrapage soumise avec succès.';
        this.showDemandeModal = false;
        this.loadMesDemandes();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erreur lors de la soumission de la demande';
      }
    });
  }

  peutDemander(module: any): boolean {
    const coursId = module.coursId || module.id;
    return !this.mesDemandes.some(d =>
      (d.coursId === coursId || d.cours?.id === coursId) &&
      d.source === 'demande_etudiant'
    );
  }

  payerBordereau(demande: any): void {
    if (!demande.id) return;
    this.payingId = demande.id;
    this.error = null;
    this.success = null;
    this.rattrapageService.creerBordereau(demande.id).subscribe({
      next: () => {
        this.payingId = null;
        this.success = 'Bordereau de paiement créé. Téléversez votre justificatif depuis « Mes bordereaux ».';
        this.router.navigate(['/inscription/bordereaux']);
      },
      error: (err) => {
        this.payingId = null;
        this.error = err?.error?.message || 'Erreur lors de la création du bordereau';
      }
    });
  }

  payerEnLigne(demande: any): void {
    if (!demande.id) return;
    this.payingId = demande.id;
    this.error = null;
    this.success = null;
    this.rattrapageService.confirmerPaiementAuto(demande.id).subscribe({
      next: () => {
        this.payingId = null;
        this.success = 'Paiement en ligne confirmé avec succès.';
        this.loadMesDemandes();
      },
      error: (err) => {
        this.payingId = null;
        this.error = err?.error?.message || 'Erreur lors du paiement en ligne';
      }
    });
  }

  statutColor(statut: string): string {
    switch (statut) {
      case 'inscrit': return 'amber';
      case 'convoque': return 'blue';
      case 'present': return 'green';
      case 'absent': return 'red';
      case 'valide': return 'purple';
      default: return 'gray';
    }
  }

  paiementBadgeClass(statutPaiement: string): string {
    return statutPaiement === 'paye'
      ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
      : 'bg-red-50 text-red-700 ring-1 ring-red-200';
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
