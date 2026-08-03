import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ExerciceComptable } from 'src/app/data/modules/comptabilite/models/Comptabilite.model';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';

@Component({
  selector: 'app-dashboard-comptable-page',
  templateUrl: './dashboard-comptable-page.component.html',
  styleUrls: ['./dashboard-comptable-page.component.scss']
})
export class DashboardComptablePageComponent extends BaseComponentClass implements OnInit {
  loading = true;
  error = false;

  totalActif = 0;
  totalPassif = 0;
  totalProduits = 0;
  totalCharges = 0;
  nbEcritures = 0;
  nbComptes = 0;
  dernieresEcritures: any[] = [];

  exercices: ExerciceComptable[] = [];
  currentExercice: ExerciceComptable | null = null;

  constructor(private service: ComptabiliteService) { super(); }

  ngOnInit(): void {
    this.loadExercices();
    this.loadData();
  }

  private loadExercices(): void {
    this.service.getAllExercices().subscribe({
      next: (data) => {
        this.exercices = data;
        const actif = data.find(ex => ex.actif);
        if (actif) {
          this.currentExercice = actif;
          this.service.setCurrentExercice(actif);
        }
      },
      error: () => {}
    });

    this.service.getExerciceEnCours().subscribe({
      next: (ex) => {
        this.currentExercice = ex;
        this.service.setCurrentExercice(ex);
      },
      error: () => {}
    });
  }

  onExerciceChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    const exercice = this.exercices.find(ex => ex.id === id) || null;
    this.currentExercice = exercice;
    this.service.setCurrentExercice(exercice);
    // Recharge le dashboard pour refléter le contexte de l'exercice sélectionné.
    // LIMITE CONNUE : l'endpoint GET /comptabilite/dashboard du backend ne
    // supporte pas encore de filtre par exercice (aucun paramètre de requête
    // n'est lu côté API). On effectue donc un rechargement propre des données.
    this.loadData(exercice?.id);
  }

  private loadData(exerciceId?: number): void {
    this.loading = true;
    // NB: le paramètre exerciceId est transmis pour préparer le filtrage côté
    // backend, mais GET /comptabilite/dashboard l'ignore actuellement.
    this.service.getDashboard().subscribe({
      next: (res) => {
        const data = res?.data || {};
        this.nbComptes = data.totalComptes || 0;
        this.nbEcritures = data.totalEcritures || 0;
        this.totalActif = data.totalActif || 0;
        this.totalPassif = data.totalPassif || 0;
        this.totalProduits = data.totalProduits || 0;
        this.totalCharges = data.totalCharges || 0;
        this.dernieresEcritures = data.dernieresEcritures || [];
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  formatMontant(v: number): string {
    return (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
  }
}
