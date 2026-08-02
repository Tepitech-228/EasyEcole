import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';
import { ExerciceComptable, CompteResultatResponse, PosteComptable } from 'src/app/data/modules/comptabilite/models/Comptabilite.model';

@Component({
  selector: 'app-compte-resultat-page',
  templateUrl: './compte-resultat-page.component.html',
  styleUrls: ['./compte-resultat-page.component.scss']
})
export class CompteResultatPageComponent extends BaseComponentClass implements OnInit {
  loading = true;
  error = false;

  dateDebut: string;
  dateFin: string;
  exercices: ExerciceComptable[] = [];
  currentExercice: ExerciceComptable | null = null;

  crpData: CompteResultatResponse['data'] | null = null;

  constructor(private service: ComptabiliteService) {
    super();
    const now = new Date();
    this.dateDebut = `${now.getFullYear()}-01-01`;
    this.dateFin = CompteResultatPageComponent.todayLocalISO();
  }

  /** Date locale du jour au format YYYY-MM-DD (évite le décalage UTC J-1). */
  private static todayLocalISO(): string {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${mm}-${dd}`;
  }

  ngOnInit(): void {
    this.loadExercices();
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
        this.loadCompteResultat();
      },
      error: () => {
        this.loadCompteResultat();
      }
    });
  }

  onExerciceChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    const exercice = this.exercices.find(ex => ex.id === id) || null;
    this.currentExercice = exercice;
    this.service.setCurrentExercice(exercice);
    this.loadCompteResultat();
  }

  onDateChange(): void {
    this.loadCompteResultat();
  }

  loadCompteResultat(): void {
    this.loading = true;
    this.error = false;
    this.crpData = null;

    const exerciceId = this.currentExercice?.id;
    this.service.getCompteResultat(this.dateDebut, this.dateFin, exerciceId).subscribe({
      next: (res) => {
        if (res.success) {
          this.crpData = res.data;
        } else {
          this.error = true;
        }
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  exportPdf(): void {
    const exerciceId = this.currentExercice?.id;
    this.service.exportCompteResultat('pdf', this.dateDebut, this.dateFin, exerciceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compte_resultat_${this.dateDebut}_${this.dateFin}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }

  exportExcel(): void {
    const exerciceId = this.currentExercice?.id;
    this.service.exportCompteResultat('xlsx', this.dateDebut, this.dateFin, exerciceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compte_resultat_${this.dateDebut}_${this.dateFin}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }

  formatMontant(v: number): string {
    return (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
  }

  /** Parse une date 'YYYY-MM-DD' en heure locale avant affichage (évite le décalage UTC J-1). */
  formatDate(date?: string | null): string {
    if (!date) return '-';
    const parts = date.split('-');
    if (parts.length !== 3) {
      const d = new Date(date);
      return isNaN(d.getTime()) ? date : d.toLocaleDateString('fr-FR');
    }
    const [y, m, day] = parts.map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('fr-FR');
  }

  get produitsPostes(): PosteComptable[] {
    return this.crpData?.produits.postes || [];
  }

  get chargesPostes(): PosteComptable[] {
    return this.crpData?.charges.postes || [];
  }

  get totalProduits(): number {
    return this.crpData?.produits.total || 0;
  }

  get totalCharges(): number {
    return this.crpData?.charges.total || 0;
  }

  get resultatNet(): number {
    return this.crpData?.resultatNet || 0;
  }

  get isBenefice(): boolean {
    return this.resultatNet >= 0;
  }

  get exerciceLibelle(): string {
    return this.currentExercice?.libelle || 'Aucun exercice';
  }
}
