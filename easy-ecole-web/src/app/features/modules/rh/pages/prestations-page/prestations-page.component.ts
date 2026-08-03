import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhPrestationEnseignantService } from 'src/app/data/modules/rh/services/rh-prestation-enseignant.service';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { PrestationEnseignant } from 'src/app/data/modules/rh/models/PrestationEnseignant.model';

@Component({
  selector: 'app-prestations-page',
  templateUrl: './prestations-page.component.html',
  styleUrls: ['./prestations-page.component.scss']
})
export class PrestationsPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  actionLoading = false;
  prestations: PrestationEnseignant[] = [];
  employes: any[] = [];
  search: string = '';
  showForm: boolean = false;

  message: string = '';
  messageType: 'success' | 'error' = 'success';

  moisOptions: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  annees: number[] = [];

  formData: any = {
    enseignantId: '',
    coursId: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    nombreHeures: '',
    tauxHoraire: '',
  };

  constructor(
    private prestationService: RhPrestationEnseignantService,
    private employeService: RhEmployeService,
  ) { super(); }

  ngOnInit(): void {
    const anneeCourante = new Date().getFullYear();
    this.annees = [anneeCourante - 1, anneeCourante, anneeCourante + 1];
    this.employeService.getAll().subscribe(data => this.employes = data);
    this.loadPrestations();
  }

  loadPrestations(): void {
    this.loading = true;
    this.prestationService.getAll().subscribe({
      next: (data) => this.prestations = data,
      error: () => {
        this.loading = false;
        this.showMessage('Impossible de charger les prestations.', 'error');
      },
      complete: () => this.loading = false
    });
  }

  get filteredPrestations(): PrestationEnseignant[] {
    const terme = this.search.trim().toLowerCase();
    if (!terme) return this.prestations;
    return this.prestations.filter(p => this.getEnseignantNom(p).toLowerCase().includes(terme));
  }

  getEnseignantNom(prest: PrestationEnseignant): string {
    const emp = prest.enseignant || (prest.enseignantId ? this.employes.find(e => e.id === prest.enseignantId) : null);
    if (!emp) return '-';
    return `${emp.nom || ''} ${emp.prenoms || ''}`.trim() || '-';
  }

  getMoisLabel(mois?: number): string {
    if (!mois) return '-';
    const noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return noms[mois - 1] || String(mois);
  }

  get montantCalcule(): number {
    const heures = Number(this.formData.nombreHeures) || 0;
    const taux = Number(this.formData.tauxHoraire) || 0;
    return heures * taux;
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'saisie': return 'bg-yellow-100 text-yellow-700';
      case 'validée': return 'bg-green-100 text-green-700';
      case 'payée':
      case 'payee': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  isValidee(prest: PrestationEnseignant): boolean {
    return prest.statut === 'validée';
  }

  estPayee(prest: PrestationEnseignant): boolean {
    return prest.statut === 'payée' || prest.statut === 'payee';
  }

  ouvrirFormulaire(): void {
    this.formData = {
      enseignantId: '',
      coursId: '',
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear(),
      nombreHeures: '',
      tauxHoraire: '',
    };
    this.showForm = true;
  }

  fermerFormulaire(): void {
    this.showForm = false;
    this.clearMessage();
  }

  creerPrestation(): void {
    if (!this.formData.enseignantId || !this.formData.coursId || !this.formData.nombreHeures || !this.formData.tauxHoraire) {
      this.showMessage('Veuillez renseigner tous les champs obligatoires.', 'error');
      return;
    }

    const item = new PrestationEnseignant();
    item.enseignantId = this.formData.enseignantId;
    item.coursId = this.formData.coursId;
    item.mois = Number(this.formData.mois);
    item.annee = Number(this.formData.annee);
    item.nombreHeures = Number(this.formData.nombreHeures);
    item.tauxHoraire = Number(this.formData.tauxHoraire);
    item.montant = this.montantCalcule;

    this.actionLoading = true;
    this.prestationService.create(item).subscribe({
      next: () => {
        this.actionLoading = false;
        this.fermerFormulaire();
        this.showMessage('Prestation créée avec succès.', 'success');
        this.loadPrestations();
      },
      error: () => {
        this.actionLoading = false;
        this.showMessage('Erreur lors de la création de la prestation.', 'error');
      }
    });
  }

  validerPrestation(prest: PrestationEnseignant): void {
    if (!prest.id) return;
    this.actionLoading = true;
    this.prestationService.valider(prest.id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.showMessage(`Prestation #${prest.id} validée.`, 'success');
        this.loadPrestations();
      },
      error: () => {
        this.actionLoading = false;
        this.showMessage('Erreur lors de la validation.', 'error');
      }
    });
  }

  payerPrestation(prest: PrestationEnseignant): void {
    if (!prest.id) return;
    if (!window.confirm(`Payer la prestation #${prest.id} ?`)) return;
    this.actionLoading = true;
    this.prestationService.payer(prest.id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.showMessage(`Prestation #${prest.id} payée.`, 'success');
        this.loadPrestations();
      },
      error: (err: any) => {
        this.actionLoading = false;
        const detail = err?.error?.message || '';
        this.showMessage(detail || 'Erreur lors du paiement.', 'error');
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private clearMessage(): void {
    this.message = '';
  }

  trackByFn(index: number, item: PrestationEnseignant): any {
    return item.id;
  }
}