import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AbsenceCoursService } from '../../services/absence-cours.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';

@Component({
  selector: 'app-absences-cours-page',
  templateUrl: './absences-cours-page.component.html',
  styleUrls: ['./absences-cours-page.component.scss']
})
export class AbsencesCoursPageComponent extends BaseComponentClass implements OnInit {
  // Student view
  cursusApprenantId: number | null = null;
  absences: any[] = [];
  stats: any = null;
  loadingAbsences: boolean = false;
  loadingStats: boolean = false;
  errorMessage: string = '';
  infoMessage: string = '';

  // Class view (admin/institution)
  viewMode: 'etudiant' | 'classe' = 'etudiant';
  classes: Classe[] = [];
  anneesAcademiques: AnneeAcademique[] = [];
  selectedClasseId: string = '';
  selectedAnneeId: string = '';
  absencesClasse: any[] = [];
  loadingClasse: boolean = false;

  constructor(
    private router: Router,
    private absenceCoursService: AbsenceCoursService,
    private classeService: ClasseService,
    private cursusApprenantService: CursusApprenantService,
    private anneeAcademiqueService: AnneeAcademiqueService,
  ) { super(); }

  ngOnInit(): void {
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.anneeAcademiqueService.getAll().subscribe(data => this.anneesAcademiques = data);

    if (this.rolesValue.isApprenant) {
      this.viewMode = 'etudiant';
      this.infoMessage = 'Mode étudiant : Vos absences seront chargées automatiquement. Saisissez votre ID cursus.';
    } else {
      this.viewMode = 'classe';
    }
  }

  chargerAbsences() {
    if (!this.cursusApprenantId) return;
    this.loadingAbsences = true;
    this.errorMessage = '';
    this.absenceCoursService.getAbsencesByEtudiant(this.cursusApprenantId).subscribe({
      next: (data) => {
        this.absences = Array.isArray(data) ? data : [];
        this.loadingAbsences = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des absences';
        this.loadingAbsences = false;
      }
    });
  }

  chargerStats() {
    if (!this.cursusApprenantId) return;
    this.loadingStats = true;
    this.absenceCoursService.getStatsByEtudiant(this.cursusApprenantId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loadingStats = false;
      },
      error: () => this.loadingStats = false
    });
  }

  chercherEtudiant() {
    this.chargerAbsences();
    this.chargerStats();
  }

  chargerAbsencesClasse() {
    if (!this.selectedClasseId || !this.selectedAnneeId) return;
    this.loadingClasse = true;
    this.errorMessage = '';
    this.absenceCoursService.getAbsencesByClasse(Number(this.selectedClasseId), Number(this.selectedAnneeId)).subscribe({
      next: (data) => {
        this.absencesClasse = Array.isArray(data) ? data : [];
        this.loadingClasse = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des absences de la classe';
        this.loadingClasse = false;
      }
    });
  }

  getEtatClass(etat: string): string {
    switch (etat) {
      case 'present': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'absent': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'justifie': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  get totalAbsences(): number {
    return this.absences.filter(a => a.etat === 'absent').length;
  }

  get totalJustifiees(): number {
    return this.absences.filter(a => a.etat === 'justifie').length;
  }

  get tauxAbsentisme(): string {
    if (!this.stats?.totalSeances || this.stats.totalSeances === 0) return '0.0';
    const abs = this.stats?.totalAbsences || 0;
    return ((abs / this.stats.totalSeances) * 100).toFixed(1);
  }

  setViewMode(mode: 'etudiant' | 'classe') {
    this.viewMode = mode;
    this.errorMessage = '';
  }

  trackByFn(index: number, item: any): number { return item.id || index; }

  retour() {
    this.router.navigate(['/bulletins']);
  }
}
