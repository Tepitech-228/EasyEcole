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
  loading = false;
  creating = false;
  showCreateForm = false;

  selectedFile: File | null = null;
  newCours = { titre: '', description: '', format: 'mixte', enseignantId: null as number | null, coursId: '' };

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.loadCours();
    this.loadEnseignants();
    this.loadCoursPedagogiques();
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

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newCours = { titre: '', description: '', format: 'mixte', enseignantId: null, coursId: '' };
      this.selectedFile = null;
    }
  }

  createCours(): void {
    if (!this.newCours.titre) return;
    this.creating = true;

    const formData = new FormData();
    formData.append('titre', this.newCours.titre);
    formData.append('description', this.newCours.description);
    formData.append('format', this.newCours.format);
    if (this.newCours.coursId) formData.append('coursId', this.newCours.coursId);
    if (this.newCours.enseignantId) formData.append('enseignantId', String(this.newCours.enseignantId));
    if (this.selectedFile) formData.append('image', this.selectedFile);

    this.http.post(`${environment.API_URL}/elearning/cours`, formData).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateForm = false;
        this.newCours = { titre: '', description: '', format: 'mixte', enseignantId: null, coursId: '' };
        this.selectedFile = null;
        this.loadCours();
      },
      error: (err) => { this.creating = false; console.error(err); }
    });
  }

  deleteCours(id: string): void {
    if (confirm('Supprimer ce cours définitivement ?')) {
      this.http.delete(`${environment.API_URL}/elearning/cours/${id}`).subscribe({
        next: () => this.loadCours(),
        error: (err) => console.error(err)
      });
    }
  }
}
