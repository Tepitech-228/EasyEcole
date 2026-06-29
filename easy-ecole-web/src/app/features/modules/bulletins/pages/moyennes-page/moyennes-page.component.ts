import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BulletinService } from '../../services/bulletin.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';

@Component({
  selector: 'app-moyennes-page',
  templateUrl: './moyennes-page.component.html',
  styleUrls: ['./moyennes-page.component.scss']
})
export class MoyennesPageComponent extends BaseComponentClass implements OnInit {
  moyennes: any[] = [];
  loading: boolean = false;
  filtreAnneeAcademiqueId: string = '';
  filtreSemestre: string = '';
  filtreClasseId: string = '';

  anneesAcademiques: AnneeAcademique[] = [];
  classes: Classe[] = [];

  constructor(
    private bulletinService: BulletinService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private classeService: ClasseService,
  ) { super(); }

  ngOnInit(): void {
    this.anneeAcademiqueService.getAll().subscribe(data => this.anneesAcademiques = data);
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.charger();
  }

  charger() {
    this.loading = true;
    const params: any = {};
    if (this.filtreAnneeAcademiqueId) params.anneeAcademiqueId = this.filtreAnneeAcademiqueId;
    if (this.filtreSemestre) params.semestre = this.filtreSemestre;
    if (this.filtreClasseId) params.classeId = this.filtreClasseId;

    this.bulletinService.getMoyennes(params).subscribe({
      next: (res) => {
        this.moyennes = Array.isArray(res) ? res : [];
      },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  resetFiltres() {
    this.filtreAnneeAcademiqueId = '';
    this.filtreSemestre = '';
    this.filtreClasseId = '';
    this.charger();
  }

  get moyenneEnsemble(): number {
    if (!this.moyennes.length) return 0;
    const sum = this.moyennes.reduce((acc, m) => acc + m.moyenneGenerale, 0);
    return +(sum / this.moyennes.length).toFixed(1);
  }

  get tauxReussiteEnsemble(): number {
    if (!this.moyennes.length) return 0;
    const sum = this.moyennes.reduce((acc, m) => acc + m.tauxReussite, 0);
    return +(sum / this.moyennes.length).toFixed(1);
  }

  get effectifTotal(): number {
    return this.moyennes.reduce((acc, m) => acc + m.effectif, 0);
  }

  getMoyenneClass(moyenne: number): string {
    if (moyenne >= 14) return 'text-green-700';
    if (moyenne >= 10) return 'text-amber-700';
    return 'text-red-700';
  }

  trackByFn(index: number, item: any): number {
    return index;
  }
}
