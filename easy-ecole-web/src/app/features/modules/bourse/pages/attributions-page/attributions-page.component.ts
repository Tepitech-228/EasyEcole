import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BourseService } from 'src/app/data/modules/bourse/services/bourse.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';

@Component({
  selector: 'app-attributions-bourse-page',
  templateUrl: './attributions-page.component.html',
  styleUrls: ['./attributions-page.component.scss']
})
export class AttributionsPageComponent extends BaseComponentClass implements OnInit {

  configurations: any[] = [];
  historique: any[] = [];
  resumeFinancier: any = null;
  loading: boolean = false;
  searchTerm: string = '';

  // Attribution form
  showAttributionModal: boolean = false;
  attributionForm: any = {};
  saving: boolean = false;

  // Detail
  showDetailModal: boolean = false;
  detailAttribution: any = null;

  // Financial summary
  showFinanceModal: boolean = false;
  financeDossierId: number | null = null;
  financeMatricule: string = '';
  financeData: any = null;

  constructor(
    private bourseService: BourseService,
    private toastService: ToastService,
    private dossierEtudiantService: DossierEtudiantService,
  ) { super(); }

  ngOnInit(): void {
    this.loadConfigurations();
  }

  loadConfigurations(): void {
    this.loading = true;
    this.bourseService.getConfigurations().subscribe({
      next: (res) => {
        this.configurations = (Array.isArray(res) ? res : []).filter((c: any) => c.statut === 'ACTIVE');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement');
      }
    });
  }

  openAttributionModal(): void {
    this.attributionForm = { matricule: '', configurationId: '', dateDebut: '', dateFin: '', motif: '' };
    this.showAttributionModal = true;
  }

  closeAttributionModal(): void {
    this.showAttributionModal = false;
    this.attributionForm = {};
  }

  saveAttribution(): void {
    if (!this.attributionForm.matricule) {
      this.toastService.error('Le matricule étudiant est obligatoire');
      return;
    }
    if (!this.attributionForm.configurationId) {
      this.toastService.error('Veuillez sélectionner une configuration de bourse');
      return;
    }
    if (!this.attributionForm.dateDebut) {
      this.toastService.error('La date de début est obligatoire');
      return;
    }

    this.findDossierByMatricule(this.attributionForm.matricule, dossierId => {
      this.saving = true;
      this.bourseService.attribuerBourse(dossierId, {
        configurationId: this.attributionForm.configurationId,
        dateDebut: this.attributionForm.dateDebut,
        dateFin: this.attributionForm.dateFin || null,
        motif: this.attributionForm.motif || null,
      }).subscribe({
        next: () => {
          this.saving = false;
          this.closeAttributionModal();
          this.toastService.success('Bourse attribuée avec succès');
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(err.error?.message || 'Erreur lors de l\'attribution');
        }
      });
    });
  }

  private findDossierByMatricule(value: string, callback: (dossierId: number) => void): void {
    const matricule = value.trim();
    if (!matricule) {
      this.toastService.error('Le matricule est obligatoire');
      return;
    }
    this.dossierEtudiantService.getAllPaginated({ search: matricule, page: 1, limit: 10 }).subscribe({
      next: (res) => {
        const dossiers = (res.data || []).filter(d => String(d.matricule || '').toLowerCase() === matricule.toLowerCase());
        if (dossiers.length === 0 || !dossiers[0].id) {
          this.toastService.error('Aucun dossier trouvé pour ce matricule');
          return;
        }
        this.financeDossierId = Number(dossiers[0].id);
        callback(this.financeDossierId);
      },
      error: () => this.toastService.error('Impossible de rechercher ce matricule')
    });
  }

  loadFinanceResumeByMatricule(): void {
    this.findDossierByMatricule(this.financeMatricule, id => this.loadFinanceResume(id));
  }

  openHistoriqueByMatricule(): void {
    this.findDossierByMatricule(this.financeMatricule, id => this.openHistorique(id));
  }

  openHistorique(dossierId: number): void {
    this.loading = true;
    this.bourseService.getHistorique(dossierId).subscribe({
      next: (res) => {
        this.historique = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement de l\'historique');
      }
    });
  }

  openDetail(attribution: any): void {
    this.detailAttribution = attribution;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.detailAttribution = null;
  }

  suspendreBourse(attribution: any): void {
    const motif = prompt('Motif de la suspension (optionnel) :');
    this.bourseService.suspendreBourse(attribution.id, motif || undefined).subscribe({
      next: () => {
        this.toastService.success('Bourse suspendue');
        if (this.financeDossierId) {
          this.loadFinanceResume(this.financeDossierId);
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Erreur lors de la suspension');
      }
    });
  }

  reactiverBourse(attribution: any): void {
    this.bourseService.reactiverBourse(attribution.id).subscribe({
      next: () => {
        this.toastService.success('Bourse réactivée');
        if (this.financeDossierId) {
          this.loadFinanceResume(this.financeDossierId);
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Erreur lors de la réactivation');
      }
    });
  }

  loadFinanceResume(dossierId: number): void {
    this.financeDossierId = dossierId;
    this.bourseService.getResumeFinancier(dossierId).subscribe({
      next: (res) => {
        this.financeData = res;
        this.showFinanceModal = true;
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Erreur lors du calcul financier');
      }
    });
  }

  closeFinanceModal(): void {
    this.showFinanceModal = false;
    this.financeData = null;
    this.financeDossierId = null;
  }

  getStatutBadge(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDUE': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIREE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeBadge(type: string): string {
    return type === 'TOTAL' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }

  formatMontant(montant: number): string {
    return (montant || 0).toLocaleString('fr-FR') + ' FCFA';
  }
}
