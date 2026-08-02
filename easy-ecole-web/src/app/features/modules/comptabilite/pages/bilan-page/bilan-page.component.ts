import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';
import { ExerciceComptable, BilanResponse, PosteComptable } from 'src/app/data/modules/comptabilite/models/Comptabilite.model';

@Component({
  selector: 'app-bilan-page',
  templateUrl: './bilan-page.component.html',
  styleUrls: ['./bilan-page.component.scss']
})
export class BilanPageComponent extends BaseComponentClass implements OnInit {
  loading = true;
  error = false;

  dateArrete: string;
  exercices: ExerciceComptable[] = [];
  currentExercice: ExerciceComptable | null = null;

  bilanData: BilanResponse['data'] | null = null;

  constructor(private service: ComptabiliteService) {
    super();
    this.dateArrete = BilanPageComponent.todayLocalISO();
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
        this.loadBilan();
      },
      error: () => {
        this.loadBilan();
      }
    });
  }

  onExerciceChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    const exercice = this.exercices.find(ex => ex.id === id) || null;
    this.currentExercice = exercice;
    this.service.setCurrentExercice(exercice);
    this.loadBilan();
  }

  onDateChange(): void {
    this.loadBilan();
  }

  loadBilan(): void {
    this.loading = true;
    this.error = false;
    this.bilanData = null;

    const exerciceId = this.currentExercice?.id;
    this.service.getBilan(this.dateArrete, exerciceId).subscribe({
      next: (res) => {
        if (res.success) {
          this.bilanData = res.data;
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
    this.service.exportBilan('pdf', this.dateArrete, exerciceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bilan_${this.dateArrete}.pdf`;
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
    this.service.exportBilan('xlsx', this.dateArrete, exerciceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bilan_${this.dateArrete}.xlsx`;
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

  get actifPostes(): PosteComptable[] {
    return this.bilanData?.actif.postes || [];
  }

  get passifPostes(): PosteComptable[] {
    return this.bilanData?.passif.postes || [];
  }

  get totalActif(): number {
    return this.bilanData?.actif.total || 0;
  }

  get totalPassif(): number {
    return this.bilanData?.passif.total || 0;
  }

  get equilibre(): boolean {
    return this.bilanData?.equilibre || false;
  }

  get ecart(): number {
    return this.bilanData?.ecart || 0;
  }

  get exerciceLibelle(): string {
    return this.currentExercice?.libelle || 'Aucun exercice';
  }
}
