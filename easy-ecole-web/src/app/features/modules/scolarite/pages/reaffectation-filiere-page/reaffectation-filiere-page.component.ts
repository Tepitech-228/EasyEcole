import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';

@Component({
  selector: 'app-reaffectation-filiere-page',
  templateUrl: './reaffectation-filiere-page.component.html',
  styleUrls: ['./reaffectation-filiere-page.component.scss']
})
export class ReaffectationFilierePageComponent extends BaseComponentClass implements OnInit {
  cursusList: CursusApprenant[] = [];
  parcoursList: Parcours[] = [];
  selectedCursus: CursusApprenant | null = null;
  selectedParcoursId = '';
  searchQuery = '';
  currentPage = 1;
  pageSize = 25;
  total = 0;
  totalPages = 1;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private cursusService: CursusApprenantService,
    private parcoursService: ParcoursService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadParcours();
    this.loadCursus();
  }

  get parcoursDuMemeCycle(): Parcours[] {
    const cycle = this.selectedCursus?.parcours?.type;
    return this.parcoursList
      .filter(parcours => !!cycle && parcours.type === cycle)
      .sort((a, b) => (a.titre || '').localeCompare(b.titre || '', 'fr', { sensitivity: 'base' }));
  }

  loadParcours(): void {
    this.parcoursService.getAll().subscribe({
      next: (parcours: any) => {
        this.parcoursList = Array.isArray(parcours) ? parcours : (parcours?.data || []);
      },
      error: () => {
        this.errorMessage = 'Impossible de charger la liste des filières.';
      }
    });
  }

  loadCursus(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cursusService.getAllPaginated({
      page: this.currentPage,
      limit: this.pageSize,
      latestPerStudent: true,
      ...(this.searchQuery.trim() ? { search: this.searchQuery.trim() } : {})
    }).subscribe({
      next: response => {
        this.cursusList = response.data || [];
        this.total = response.pagination?.total || 0;
        this.totalPages = Math.max(1, response.pagination?.totalPages || 1);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger la liste des étudiants.';
        this.loading = false;
      }
    });
  }

  rechercher(): void {
    this.currentPage = 1;
    this.loadCursus();
  }

  selectionnerEtudiant(cursus: CursusApprenant): void {
    this.selectedCursus = cursus;
    this.selectedParcoursId = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  annulerSelection(): void {
    this.selectedCursus = null;
    this.selectedParcoursId = '';
  }

  reaffecter(): void {
    if (!this.selectedCursus?.id || !this.selectedParcoursId || this.saving) return;
    const cible = this.parcoursDuMemeCycle.find(parcours => String(parcours.id) === this.selectedParcoursId);
    if (!cible) {
      this.errorMessage = 'Sélectionnez une filière du même cycle.';
      return;
    }

    const nom = this.nomEtudiant(this.selectedCursus);
    const confirmation = window.confirm(
      `Réaffecter ${nom} vers « ${cible.titre} » ? Sa classe actuelle sera retirée. Les cours, notes et présences déjà enregistrés seront conservés.`
    );
    if (!confirmation) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cursusService.reaffecterFiliere(this.selectedCursus.id, this.selectedParcoursId).subscribe({
      next: () => {
        this.successMessage = `${nom} a été réaffecté(e) vers « ${cible.titre} ».`;
        this.selectedCursus = null;
        this.selectedParcoursId = '';
        this.saving = false;
        this.loadCursus();
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'La réaffectation a échoué.';
        this.saving = false;
      }
    });
  }

  nomEtudiant(cursus: CursusApprenant): string {
    const utilisateur = cursus.utilisateur;
    const nom = `${utilisateur?.prenoms || ''} ${utilisateur?.nom || ''}`.trim();
    return nom || `Étudiant #${cursus.utilisateurId || cursus.id}`;
  }

  pagePrecedente(): void {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.loadCursus();
  }

  pageSuivante(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.loadCursus();
  }
}
