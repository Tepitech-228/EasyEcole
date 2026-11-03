import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { JwtTokenService } from 'src/app/core/services/jwt-token.service';
import { ElearningExamenService } from 'src/app/data/modules/elearning/services/elearning-examen.service';

@Component({
  selector: 'app-centres-examens-page',
  templateUrl: './centres-examens-page.component.html'
})
export class CentresExamensPageComponent implements OnInit {
  isAdmin = false;
  centres: any[] = [];
  sessions: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  form = {
    nom: '',
    code: '',
    ville: '',
    adresse: '',
    telephone: '',
    capacite: 40,
    responsableId: ''
  };

  constructor(
    private examService: ElearningExamenService,
    private jwtTokenService: JwtTokenService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem(LocalStorageService.AUTH_TOKEN);
    if (token) {
      this.jwtTokenService.setToken(token);
      const role = (this.jwtTokenService.getDecodeToken() as any)?.role;
      this.isAdmin = role === 'admin' || role === 'institution';
    }

    if (!this.isAdmin) {
      this.errorMessage = 'Cette page est réservée à l’administration.';
      return;
    }

    this.loadCentres();
  }

  loadCentres(): void {
    this.loading = true;
    this.errorMessage = '';
    this.examService.getCentres().subscribe({
      next: (centres) => {
        this.centres = Array.isArray(centres) ? centres : [];
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Impossible de charger les centres.';
        this.loading = false;
      }
    });
  }

  createCentre(): void {
    if (!this.form.nom || !this.form.code || !this.form.ville || !this.form.responsableId) {
      this.errorMessage = 'Nom, code, ville et responsable sont requis.';
      return;
    }

    this.examService.createCentre({
      nom: this.form.nom,
      code: this.form.code,
      ville: this.form.ville,
      adresse: this.form.adresse,
      telephone: this.form.telephone,
      capacite: Number(this.form.capacite) || 0,
      responsableId: Number(this.form.responsableId)
    }).subscribe({
      next: () => {
        this.successMessage = 'Centre enregistré.';
        this.form = { nom: '', code: '', ville: '', adresse: '', telephone: '', capacite: 40, responsableId: '' };
        this.loadCentres();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Le centre n’a pas pu être créé.';
      }
    });
  }
}
