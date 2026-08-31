import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';

@Component({
  selector: 'app-bordereaux-a-traiter-page',
  templateUrl: './bordereaux-a-traiter-page.component.html',
  styleUrls: ['./bordereaux-a-traiter-page.component.scss']
})
export class BordereauxATraiterPageComponent extends BaseComponentClass implements OnInit {
  bordereaux: Bordereau[] = [];
  loading = true;
  error = false;
  apiErrorMessage = '';
  searchTerm = '';

  selectedBordereau?: Bordereau;
  showVerificationModal = false;

  constructor(private bordereauService: BordereauService) {
    super();
  }

  ngOnInit(): void {
    this.loadBordereaux();
  }

  private loadBordereaux(): void {
    this.loading = true;
    this.bordereauService.getAll({ statut: 'en_attente' }).subscribe({
      next: (res: any) => {
        this.bordereaux = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        this.error = true;
        this.apiErrorMessage = err?.error?.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  get bordereauxFiltres(): Bordereau[] {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) return this.bordereaux;
    return this.bordereaux.filter(b => {
      const etudiant = `${b.utilisateur?.nom ?? ''} ${b.utilisateur?.prenoms ?? ''}`.toLowerCase();
      const matricule = (b.echeance?.dossierEtudiant?.matricule || '').toLowerCase();
      return etudiant.includes(q) || matricule.includes(q);
    });
  }

  openVerification(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau;
    this.showVerificationModal = true;
  }

  closeVerification(): void {
    this.showVerificationModal = false;
    this.selectedBordereau = undefined;
  }

  onValider(): void {
    if (!this.selectedBordereau) return;
    this.bordereauService.valider(this.selectedBordereau.id!).subscribe({
      next: () => {
        this.closeVerification();
        this.loadBordereaux();
      },
      error: (err) => {
        this.apiErrorMessage = err?.error?.message || 'Erreur lors de la validation';
        this.error = true;
      }
    });
  }

  onRejeter(commentaire: string): void {
    if (!this.selectedBordereau) return;
    this.bordereauService.rejeter(this.selectedBordereau.id!, commentaire).subscribe({
      next: () => {
        this.closeVerification();
        this.loadBordereaux();
      },
      error: (err) => {
        this.apiErrorMessage = err?.error?.message || 'Erreur lors du rejet';
        this.error = true;
      }
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value == null) return '---';
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }

  getDocUrl(bordereau: Bordereau): string {
    return `${environment.API_MODULES.INSCRIPTION}/bordereaux/${bordereau.id}/download`;
  }
}
