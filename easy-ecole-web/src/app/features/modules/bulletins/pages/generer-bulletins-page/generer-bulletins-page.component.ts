import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BulletinService } from '../../services/bulletin.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { SalleDeClasseService } from 'src/app/data/modules/inscription/services/salle-de-classe.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { SalleDeClasse } from 'src/app/data/modules/inscription/models/SalleDeClasse.model';
import { ToastService } from 'src/app/core/services/toast.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-generer-bulletins-page',
  templateUrl: './generer-bulletins-page.component.html',
  styleUrls: ['./generer-bulletins-page.component.scss']
})
export class GenererBulletinsPageComponent extends BaseComponentClass implements OnInit {
  // Paramètres de génération
  anneeAcademiqueId: string | null = null;
  niveauId: string | null = null;
  parcoursId: string | null = null;
  classeId: string | null = null;
  salleId: string | null = null;
  semestre: string = ''; // '' = tous les semestres

  loading: boolean = false;
  genererLoading: boolean = false;
  resultat: any[] | null = null;
  erreur: string | null = null;

  // Données de cascade
  anneesAcademiques: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  classes: Classe[] = [];
  salles: SalleDeClasse[] = [];

  constructor(
    private bulletinService: BulletinService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private classeService: ClasseService,
    private salleDeClasseService: SalleDeClasseService,
    private toastService: ToastService,
    private router: Router,
  ) {
    super();
  }

  ngOnInit() {
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
      this.router.navigate(['/bulletins']);
      return;
    }
    this.anneeAcademiqueService.getAll().subscribe(data => this.anneesAcademiques = data);
    this.niveauEtudeService.getAll().subscribe(data => this.niveaux = data);
    this.classeService.getAll().subscribe(data => this.classes = data);
  }

  onNiveauChange(): void {
    this.parcoursId = null;
    this.classeId = null;
    this.salleId = null;
    this.salles = [];

    if (!this.niveauId) {
      this.parcoursList = [];
      return;
    }
    this.parcoursService.getAll(this.niveauId).subscribe({
      next: (data) => this.parcoursList = data,
      error: () => this.parcoursList = []
    });
  }

  onParcoursChange(): void {
    this.classeId = null;
    this.salleId = null;
    this.salles = [];
  }

  onClasseChange(): void {
    this.salleId = null;
    this.salles = [];

    if (!this.classeId) return;
    this.salleDeClasseService.getAll(this.classeId, this.parcoursId ?? undefined).subscribe({
      next: (data) => this.salles = data,
      error: () => this.salles = []
    });
  }

  /** Classes disponibles selon la cascade (niveau + filière/parcours), sinon toutes. */
  get classesVisibles(): Classe[] {
    if (!this.niveauId && !this.parcoursId) return this.classes;
    return this.classes.filter(c =>
      (!this.niveauId || c.niveauEtudeId === this.niveauId) &&
      (!this.parcoursId || c.parcoursId === this.parcoursId)
    );
  }

  get recapComplete(): boolean {
    return !!this.anneeAcademiqueId && !!this.classeId;
  }

  generer() {
    if (!this.anneeAcademiqueId || !this.classeId) return;
    this.genererLoading = true;
    this.erreur = null;

    this.bulletinService.generer(
      Number(this.classeId),
      this.semestre || null,
      Number(this.anneeAcademiqueId),
      this.salleId
    ).subscribe({
      next: (data) => {
        this.resultat = data;
        const nb = data?.length || 0;
        this.toastService.success(
          `${nb} bulletin${nb > 1 ? 's' : ''} généré${nb > 1 ? 's' : ''} pour la classe ${this.getClasseLibelle()}`
        );
      },
      error: (err) => {
        const message = err.error?.message || 'Erreur de génération';
        this.erreur = message;
        this.toastService.error(message);
      },
      complete: () => this.genererLoading = false
    });
  }

  getReussi(): number {
    return this.resultat?.length || 0;
  }

  getAnneeLibelle(): string {
    const a = this.anneesAcademiques.find(x => x.id === this.anneeAcademiqueId);
    return a?.libelle || '---';
  }

  getNiveauLibelle(): string {
    const n = this.niveaux.find(x => x.id === this.niveauId);
    return n?.libelle || '---';
  }

  getParcoursLibelle(): string {
    const p = this.parcoursList.find(x => x.id === this.parcoursId);
    return p?.titre || '---';
  }

  getClasseLibelle(): string {
    const c = this.classes.find(x => x.id === this.classeId);
    return c?.libelle || '---';
  }

  getSalleLibelle(): string {
    const s = this.salles.find(x => x.id === this.salleId);
    return s?.libelle || 'Toutes les salles';
  }

  getSemestreLabel(): string {
    if (!this.semestre) return 'Tous les semestres';
    const labels: Record<string, string> = {
      semestre1: 'Semestre 1', semestre2: 'Semestre 2', semestre3: 'Semestre 3',
      semestre4: 'Semestre 4', semestre5: 'Semestre 5', semestre6: 'Semestre 6'
    };
    return labels[this.semestre] || this.semestre;
  }
}