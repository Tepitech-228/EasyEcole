import { Component, OnInit } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, concatMap, finalize, tap } from 'rxjs/operators';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import {
  HikvisionStaffCandidate,
  HikvisionStaffRetryResult,
  HikvisionStudentCandidate,
  PointageService
} from 'src/app/data/modules/inscription/services/pointage.service';

type ResultRowStatus = 'pending' | 'done' | 'error';

interface RelanceResultRow {
  key: string;
  utilisateurId: number;
  nomComplet: string;
  statut: ResultRowStatus;
  result?: HikvisionStaffRetryResult;
  message?: string;
}

interface RelanceJob {
  key: string;
  utilisateurId: number;
  nomComplet: string;
  execute: () => Observable<HikvisionStaffRetryResult>;
}

@Component({
  selector: 'app-relance-comptes-pointeuse-page',
  templateUrl: './relance-comptes-pointeuse-page.component.html',
  styleUrls: ['./relance-comptes-pointeuse-page.component.scss']
})
export class RelanceComptesPointeusePageComponent extends BaseComponentClass implements OnInit {
  candidats: HikvisionStaffCandidate[] = [];
  etudiants: HikvisionStudentCandidate[] = [];
  sites: { id: number; nom: string }[] = [];
  selectedIds: number[] = [];
  selectedStudentKeys: string[] = [];
  selectedSiteId = '';
  searchTerm = '';
  loading = false;
  loadError = '';
  showResults = false;
  processing = false;
  resultRows: RelanceResultRow[] = [];

  constructor(private pointageService: PointageService) {
    super();
  }

  ngOnInit(): void {
    this.loadCandidates();
  }

  get filteredCandidates(): HikvisionStaffCandidate[] {
    const term = this.normalize(this.searchTerm);
    const siteId = Number(this.selectedSiteId);
    return this.candidats.filter(candidate => {
      if (this.selectedSiteId && !candidate.siteIds.includes(siteId)) return false;
      if (this.selectedSiteId && !this.hasMissingAccountOnSite(candidate, siteId)) return false;
      if (!term) return true;
      const searchable = [
        candidate.nom,
        candidate.prenoms,
        candidate.identifiant,
        candidate.employeeNo,
        candidate.role
      ].join(' ');
      return this.normalize(searchable).includes(term);
    });
  }

  get allVisibleSelected(): boolean {
    return this.filteredCandidates.length > 0 &&
      this.filteredCandidates.every(candidate => this.selectedIds.includes(candidate.utilisateurId));
  }

  get filteredStudents(): HikvisionStudentCandidate[] {
    const term = this.normalize(this.searchTerm);
    const siteId = Number(this.selectedSiteId);
    return this.etudiants.filter(student => {
      if (this.selectedSiteId && student.siteId !== siteId) return false;
      if (!term) return true;
      const searchable = [
        student.nom,
        student.prenoms,
        student.identifiant,
        student.employeeNo
      ].join(' ');
      return this.normalize(searchable).includes(term);
    });
  }

  get allVisibleStudentsSelected(): boolean {
    return this.filteredStudents.length > 0 &&
      this.filteredStudents.every(student => this.selectedStudentKeys.includes(student.key));
  }

  get completedCount(): number {
    return this.resultRows.filter(row => row.statut !== 'pending').length;
  }

  loadCandidates(): void {
    this.loading = true;
    this.loadError = '';
    this.pointageService.getComptesPersonnelAEnroler().subscribe({
      next: response => {
        this.candidats = Array.isArray(response?.utilisateurs) ? response.utilisateurs : [];
        this.etudiants = Array.isArray(response?.etudiants) ? response.etudiants : [];
        this.sites = Array.isArray(response?.sites) ? response.sites : [];
        const existingIds = new Set(this.candidats.map(candidate => candidate.utilisateurId));
        this.selectedIds = this.selectedIds.filter(id => existingIds.has(id));
        const existingStudentKeys = new Set(this.etudiants.map(student => student.key));
        this.selectedStudentKeys = this.selectedStudentKeys.filter(key => existingStudentKeys.has(key));
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.loadError = error?.error?.message || 'Impossible de charger les comptes à créer sur les pointeuses.';
      }
    });
  }

  toggleVisibleSelection(checked: boolean): void {
    const visibleIds = this.filteredCandidates.map(candidate => candidate.utilisateurId);
    if (checked) {
      this.selectedIds = Array.from(new Set([...this.selectedIds, ...visibleIds]));
    } else {
      const visible = new Set(visibleIds);
      this.selectedIds = this.selectedIds.filter(id => !visible.has(id));
    }
  }

  onSiteChange(): void {
    this.selectedIds = [];
    this.selectedStudentKeys = [];
  }

  toggleCandidateSelection(utilisateurId: number, checked: boolean): void {
    if (checked && !this.selectedIds.includes(utilisateurId)) {
      this.selectedIds = [...this.selectedIds, utilisateurId];
    } else if (!checked) {
      this.selectedIds = this.selectedIds.filter(id => id !== utilisateurId);
    }
  }

  toggleVisibleStudentSelection(checked: boolean): void {
    const visibleKeys = this.filteredStudents.map(student => student.key);
    if (checked) {
      this.selectedStudentKeys = Array.from(new Set([...this.selectedStudentKeys, ...visibleKeys]));
    } else {
      const visible = new Set(visibleKeys);
      this.selectedStudentKeys = this.selectedStudentKeys.filter(key => !visible.has(key));
    }
  }

  toggleStudentSelection(key: string, checked: boolean): void {
    if (checked && !this.selectedStudentKeys.includes(key)) {
      this.selectedStudentKeys = [...this.selectedStudentKeys, key];
    } else if (!checked) {
      this.selectedStudentKeys = this.selectedStudentKeys.filter(item => item !== key);
    }
  }

  relancerSelection(): void {
    if (this.processing || this.selectedIds.length === 0) return;
    const selected = this.candidats.filter(candidate => this.selectedIds.includes(candidate.utilisateurId));
    if (selected.length === 0) return;

    this.runRelance(selected.map(candidate => {
      const key = `personnel:${candidate.utilisateurId}`;
      const etablissementId = this.selectedSiteId ? Number(this.selectedSiteId) : undefined;
      return {
        key,
        utilisateurId: candidate.utilisateurId,
        nomComplet: `${candidate.prenoms} ${candidate.nom}`.trim(),
        execute: () => this.pointageService.relancerComptePersonnelHikvision(candidate.utilisateurId, etablissementId)
      };
    }));
  }

  relancerSelectionEtudiants(): void {
    if (this.processing || this.selectedStudentKeys.length === 0) return;
    const selected = this.etudiants.filter(student => this.selectedStudentKeys.includes(student.key));
    if (selected.length === 0) return;
    this.runRelance(selected.map(student => ({
      key: `etudiant:${student.key}`,
      utilisateurId: student.utilisateurId,
      nomComplet: `${student.prenoms} ${student.nom} · ${student.siteNom}`,
      execute: () => this.pointageService.relancerCompteEtudiantHikvision(student.utilisateurId, student.siteId)
    })));
  }

  relancerUnCompte(utilisateurId: number): void {
    this.selectedIds = [utilisateurId];
    this.relancerSelection();
  }

  relancerUnEtudiant(student: HikvisionStudentCandidate): void {
    this.selectedStudentKeys = [student.key];
    this.relancerSelectionEtudiants();
  }

  closeResults(): void {
    if (this.processing) return;
    this.showResults = false;
  }

  roleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      admin: 'Administrateur',
      enseignant: 'Enseignant',
      personnel_administratif: 'Personnel administratif',
      surveillant: 'Surveillant',
      secretaire: 'Secrétaire',
      ressources_humaines: 'Ressources humaines',
      cabinet_comptable: 'Cabinet comptable',
      esa_compta: 'ESA Compta',
      comite_orientation: "Comité d’orientation",
      superviseur_general: 'Superviseur général'
    };
    return labels[role] || role;
  }

  candidateStatus(candidate: HikvisionStaffCandidate): string {
    const terminals = this.terminalsForCandidate(candidate);
    if (terminals.length === 0) return 'Aucune pointeuse active';
    if (terminals.some(terminal => terminal.compteCree)) return 'Présence partielle';
    return 'Compte absent';
  }

  resultStatusLabel(row: RelanceResultRow): string {
    if (row.statut === 'pending') return 'En cours…';
    if (row.statut === 'error') return 'Erreur';
    const terminals = row.result?.terminaux || [];
    if (terminals.length === 0) return 'Non créé';
    const createdCount = terminals.filter(terminal => terminal.compteCree).length;
    if (createdCount === terminals.length) return 'Compte créé / présent';
    if (createdCount > 0) return 'Partiellement créé';
    if (terminals.some(terminal => terminal.statut === 'en_cours')) return 'Toujours en cours';
    return 'Non créé';
  }

  terminalResultLabel(statut: string): string {
    if (statut === 'deja_present') return 'Déjà créé';
    if (statut === 'cree') return 'Créé';
    if (statut === 'en_cours') return 'En cours';
    return 'Échec';
  }

  terminalsForCandidate(candidate: HikvisionStaffCandidate): HikvisionStaffCandidate['terminaux'] {
    if (!this.selectedSiteId) return candidate.terminaux;
    return candidate.terminaux.filter(terminal => terminal.etablissementId === Number(this.selectedSiteId));
  }

  missingCount(candidate: HikvisionStaffCandidate): number {
    return this.terminalsForCandidate(candidate).filter(terminal => !terminal.compteCree).length;
  }

  private hasMissingAccountOnSite(candidate: HikvisionStaffCandidate, siteId: number): boolean {
    const terminals = candidate.terminaux.filter(terminal => terminal.etablissementId === siteId);
    return terminals.length === 0 || terminals.some(terminal => !terminal.compteCree);
  }

  private updateResult(utilisateurId: number, result: RelanceResultRow): void {
    this.resultRows = this.resultRows.map(row =>
      row.utilisateurId === utilisateurId && row.key === result.key ? result : row
    );
  }

  private runRelance(jobs: RelanceJob[]): void {
    this.resultRows = jobs.map(job => ({
      key: job.key,
      utilisateurId: job.utilisateurId,
      nomComplet: job.nomComplet,
      statut: 'pending'
    }));
    this.showResults = true;
    this.processing = true;

    from(jobs).pipe(
      concatMap(job => job.execute().pipe(
        tap(result => this.updateResult(job.utilisateurId, {
          key: job.key,
          utilisateurId: job.utilisateurId,
          nomComplet: job.nomComplet,
          statut: 'done',
          result
        })),
        catchError(error => {
          this.updateResult(job.utilisateurId, {
            key: job.key,
            utilisateurId: job.utilisateurId,
            nomComplet: job.nomComplet,
            statut: 'error',
            message: error?.error?.message || 'La relance a échoué avant que la pointeuse ne confirme le résultat.'
          });
          return of(null);
        })
      )),
      finalize(() => {
        this.processing = false;
        this.selectedIds = [];
        this.selectedStudentKeys = [];
        this.loadCandidates();
      })
    ).subscribe();
  }

  private normalize(value: string | null | undefined): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
