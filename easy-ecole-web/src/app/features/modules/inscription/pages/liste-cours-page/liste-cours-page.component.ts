import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { DossierNode, DossierColumn } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { FilterValue } from 'src/app/shared/components/filters-annee-niveau-parcours/filters-annee-niveau-parcours.component';
import { SemestresParcours } from 'src/app/data/enums/SemestresParcours';

@Component({
  selector: 'app-liste-cours-page',
  templateUrl: './liste-cours-page.component.html',
  styleUrls: ['./liste-cours-page.component.scss']
})
export class ListeCoursPageComponent extends BaseComponentClass implements OnInit {

  columns: DossierColumn[] = [
    { key: 'code', label: 'Code', width: '100px' },
    { key: 'intitule', label: 'Intitulé', width: 'auto' },
    { key: 'credit', label: 'Crédits', width: '80px' },
    { key: 'semestre', label: 'Semestre', width: '120px' },
    { key: 'classe', label: 'Classe', width: '120px' },
    { key: 'estObligatoire', label: 'Obligatoire', width: '100px' },
  ];

  nodes: DossierNode[] = [];

  annees: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  sessions: Session[] = [];
  classes: Classe[] = [];
  semestres = Object.values(SemestresParcours);

  selectedSemestre: string = '';
  selectedClasseId: string = '';

  loading: boolean = false;
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;
  pageSize: number = 20;

  currentFilter: FilterValue = { anneeId: '', niveauId: '', parcoursId: '' };

  showNouveaucoursModal: boolean = false
  showEditerCoursModal: boolean = false
  showSupprimerCoursModal: boolean = false

  selectedCours?: Cours
  cours: Cours[] = []

  coursForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    parcours: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor(
    private router: Router,
    private coursService: CoursService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private classeService: ClasseService,
  ) {
    super()
    if (!this.rolesValue.isApprenant && !this.rolesValue.isInstitution && !this.rolesValue.isAdmin && !this.rolesValue.isEnseignant) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.loadFilterData();
  }

  private loadFilterData(): void {
    this.anneeAcademiqueService.getAll().subscribe(annees => {
      this.annees = annees;
    });
    this.niveauEtudeService.getAll().subscribe(niveaux => {
      this.niveaux = niveaux;
    });
    this.parcoursService.getAll().subscribe(parcoursList => {
      this.parcoursList = parcoursList;
    });
    this.sessionService.getAll().subscribe(sessions => {
      this.sessions = sessions;
    });
    this.classeService.getAll().subscribe(classes => {
      this.classes = classes;
    });
  }

  onFilterChange(filter: FilterValue): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.loadCours();
  }

  onSemestreChange(): void {
    this.currentPage = 1;
    this.loadCours();
  }

  onClasseChange(): void {
    this.currentPage = 1;
    this.loadCours();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCours();
  }

  private loadCours(): void {
    this.loading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.currentFilter.parcoursId) {
      params.parcoursId = this.currentFilter.parcoursId;
    }
    if (this.selectedSemestre) {
      params.semestre = this.selectedSemestre;
    }
    if (this.selectedClasseId) {
      params.classeId = this.selectedClasseId;
    }

    this.coursService.getAllPaginated(params).subscribe({
      next: (response) => {
        this.nodes = this.buildTree(response.data);
        this.currentPage = response.pagination.page;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.total;
        this.pageSize = response.pagination.limit;
        this.cours = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private buildTree(coursList: Cours[]): DossierNode[] {
    const parcoursMap = new Map<string, { parcours: Parcours, semestres: Map<string, Cours[]> }>();

    for (const cours of coursList) {
      const pid = cours.parcoursId || 'unknown';
      if (!parcoursMap.has(pid)) {
        parcoursMap.set(pid, {
          parcours: cours.parcours || new Parcours(),
          semestres: new Map()
        });
      }
      const p = parcoursMap.get(pid)!;
      const sem = cours.semestre || 'non-defini';
      if (!p.semestres.has(sem)) p.semestres.set(sem, []);
      p.semestres.get(sem)!.push(cours);
    }

    const nodes: DossierNode[] = [];
    for (const [, group] of parcoursMap) {
      const parcours = group.parcours;
      const niveauLabel = parcours.niveauEtude?.libelle
        ? `${parcours.niveauEtude.libelle} - `
        : '';

      const semChildren: DossierNode[] = [];
      for (const [sem, cours] of group.semestres) {
        semChildren.push({
          type: 'item',
          label: `Semestre ${sem.replace('semestre', '')}`,
          expanded: true,
          items: cours.map(c => ({
            id: c.id,
            code: c.code,
            intitule: c.intitule,
            credit: c.credit,
            semestre: c.semestre,
            classe: c.classe?.libelle || '',
            estObligatoire: c.estObligatoire ? 'Oui' : 'Non',
            data: c,
          })),
        });
      }

      nodes.push({
        type: 'parcours',
        id: parcours.id,
        label: `${niveauLabel}${parcours.titre || 'Parcours'}`,
        expanded: true,
        children: semChildren,
      });
    }

    return nodes;
  }

  ajouterCours(): void {
    this.coursForm.markAllAsTouched()
  }

  // Modals
  openEditerCoursModal(cours): void {
    this.selectedCours = cours
    this.showEditerCoursModal = true
  }

  openSupprimerCoursModal(cours): void {
    this.selectedCours = cours
    this.showSupprimerCoursModal = true
  }

  closeNouveaucoursModal(): void {
    this.showNouveaucoursModal = false
  }
}
