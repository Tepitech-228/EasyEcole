import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-gestion-elearning-page',
  templateUrl: './gestion-elearning-page.component.html',
  styleUrls: ['./gestion-elearning-page.component.scss']
})
export class GestionElearningPageComponent extends BaseComponentClass implements OnInit {
  coursList: any[] = [];
  enseignants: any[] = [];
  coursPedagogiques: any[] = [];
  annees: Array<{ id: number; libelle: string; active: boolean }> = [];
  prixCredit = 0;
  loading = false;
  creating = false;
  showCreateForm = false;

  selectedFile: File | null = null;
  editingCoursId: number | null = null;
  newCours = {
    code: '', titre: '', description: '', format: 'mixte',
    professeurId: null as number | null, chargeSupportId: null as number | null,
    coursId: '', anneeAcademiqueId: null as number | null, nbCredits: 1, niveauEtudeId: null as number | null
  };

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.loadCours();
    this.loadEnseignants();
    this.loadCoursPedagogiques();
    this.loadAnneesEtTarif();
  }

  canManageExams(): boolean {
    return this.rolesValue.isAdmin || this.rolesValue.isInstitution;
  }

  loadAnneesEtTarif(): void {
    this.http.get<Array<{ id: number; libelle: string; active: boolean }>>(`${environment.API_URL}/elearning/annees`).subscribe({
      next: annees => {
        this.annees = annees;
        const active = annees.find(annee => annee.active);
        if (active && !this.newCours.anneeAcademiqueId) this.newCours.anneeAcademiqueId = active.id;
      },
      error: err => console.error('Impossible de charger les années e-learning:', err)
    });
    this.http.get<{ prixCredit: number }>(`${environment.API_URL}/elearning/tarif-credit`).subscribe({
      next: data => this.prixCredit = Number(data.prixCredit || 0),
      error: err => console.error('Impossible de charger le tarif e-learning:', err)
    });
  }

  loadCours(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/cours`).subscribe({
      next: (data: any) => { this.coursList = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadEnseignants(): void {
    this.http.get(`${environment.API_URL}/auth/enseignants`).subscribe({
      next: (data: any) => { this.enseignants = data; },
      error: () => {}
    });
  }

  loadCoursPedagogiques(): void {
    this.http.get(`${environment.API_URL}/inscription/cours`).subscribe({
      next: (data: any) => { this.coursPedagogiques = Array.isArray(data) ? data : []; },
      error: () => {}
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target?.files?.[0] || null;
  }

  onCoursPedagogiqueChange(coursId: string): void {
    const selected = this.coursPedagogiques.find(cours => String(cours.id) === String(coursId));
    this.newCours.niveauEtudeId = selected?.parcours?.niveauEtudeId
      || selected?.classe?.niveauEtudeId
      || null;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
      this.editingCoursId = null;
      this.selectedFile = null;
    }
  }

  createCours(): void {
    if (!this.newCours.titre || !this.newCours.code || !this.newCours.anneeAcademiqueId || this.newCours.nbCredits < 1) return;
    this.creating = true;

    const formData = new FormData();
    formData.append('code', this.newCours.code);
    formData.append('titre', this.newCours.titre);
    formData.append('description', this.newCours.description);
    formData.append('format', this.newCours.format);
    formData.append('anneeAcademiqueId', String(this.newCours.anneeAcademiqueId));
    formData.append('nbCredits', String(this.newCours.nbCredits));
    if (this.newCours.coursId) formData.append('coursId', this.newCours.coursId);
    if (this.newCours.coursId) formData.append('ueId', this.newCours.coursId);
    if (this.newCours.niveauEtudeId) formData.append('niveauEtudeId', String(this.newCours.niveauEtudeId));
    if (this.newCours.professeurId) formData.append('professeurId', String(this.newCours.professeurId));
    if (this.newCours.chargeSupportId) formData.append('chargeSupportId', String(this.newCours.chargeSupportId));
    if (this.selectedFile) formData.append('image', this.selectedFile);

    const request = this.editingCoursId
      ? this.http.put(`${environment.API_URL}/elearning/cours/${this.editingCoursId}`, {
        code: this.newCours.code,
        titre: this.newCours.titre,
        description: this.newCours.description,
        format: this.newCours.format,
        anneeAcademiqueId: this.newCours.anneeAcademiqueId,
        nbCredits: this.newCours.nbCredits,
        coursId: this.newCours.coursId || null,
        ueId: this.newCours.coursId || null,
        niveauEtudeId: this.newCours.niveauEtudeId,
        professeurId: this.newCours.professeurId,
        chargeSupportId: this.newCours.chargeSupportId
      })
      : this.http.post(`${environment.API_URL}/elearning/cours`, formData);
    request.subscribe({
      next: () => {
        this.creating = false;
        this.showCreateForm = false;
        this.resetForm();
        this.editingCoursId = null;
        this.selectedFile = null;
        this.loadCours();
      },
      error: (err) => { this.creating = false; console.error(err); }
    });
  }

  editCours(cours: any): void {
    this.editingCoursId = Number(cours.id);
    this.newCours = {
      code: cours.code || '',
      titre: cours.titre || '',
      description: cours.description || '',
      format: cours.format || 'mixte',
      professeurId: cours.professeurId || cours.enseignantId || null,
      chargeSupportId: cours.chargeSupportId || null,
      coursId: cours.ueId || cours.coursId || '',
      anneeAcademiqueId: cours.anneeAcademiqueId || null,
      nbCredits: Number(cours.nbCredits || 1),
      niveauEtudeId: cours.niveauEtudeId || cours.ue?.parcours?.niveauEtudeId || null
    };
    this.showCreateForm = true;
  }

  changeStatus(cours: any, statut: string): void {
    this.http.put(`${environment.API_URL}/elearning/cours/${cours.id}`, { statut }).subscribe({
      next: () => this.loadCours(),
      error: err => console.error('Impossible de modifier le statut du cours:', err)
    });
  }

  private resetForm(): void {
    const active = this.annees.find(annee => annee.active);
    this.newCours = {
      code: '', titre: '', description: '', format: 'mixte',
      professeurId: null, chargeSupportId: null,
      coursId: '', anneeAcademiqueId: active?.id || null, nbCredits: 1, niveauEtudeId: null
    };
  }
}
