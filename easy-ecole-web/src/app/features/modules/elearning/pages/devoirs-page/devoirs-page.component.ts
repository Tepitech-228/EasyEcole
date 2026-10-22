import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DevoirService } from 'src/app/data/modules/elearning/services/devoir.service';
import { CoursEnLigneService } from 'src/app/data/modules/elearning/services/cours-en-ligne.service';
import { JwtTokenService } from 'src/app/core/services/jwt-token.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

@Component({
  selector: 'app-devoirs-page',
  templateUrl: './devoirs-page.component.html',
  styleUrls: ['./devoirs-page.component.scss']
})
export class DevoirsPageComponent implements OnInit {
  devoirs: any[] = [];
  coursList: any[] = [];
  loading = true;
  showCreateModal = false;
  createForm: any = { titre: '', description: '', dateLimite: '', coursId: '', semestre: 1, poids: 50 };
  selectedFile: File | null = null;
  createError = '';

  constructor(
    private router: Router,
    private devoirService: DevoirService,
    private coursService: CoursEnLigneService,
    private jwtTokenService: JwtTokenService
  ) { }

  ngOnInit(): void {
    this.loadDevoirs();
    if (this.canManage()) this.coursService.getAll().subscribe({ next: (d) => this.coursList = d });
  }

  loadDevoirs(): void {
    this.loading = true;
    this.devoirService.getAll().subscribe({
      next: (data) => { this.devoirs = data.map(d => this.enrichDevoir(d)); this.loading = false; },
      error: () => this.loading = false
    });
  }

  private enrichDevoir(d: any): any {
    let statut = 'à rendre';
    if (d.soumission) {
      statut = d.soumission.note !== null && d.soumission.note !== undefined ? 'noté' : 'soumis';
    }
    return { ...d, statut };
  }

  voirDevoir(id: string): void {
    this.router.navigate(['/elearning/devoirs', id]);
  }

  openCreateModal(): void {
    this.createError = '';
    this.showCreateModal = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  createDevoir(): void {
    if (!this.selectedFile || this.selectedFile.type !== 'application/pdf') {
      this.createError = 'Le sujet du devoir doit être un fichier PDF.';
      return;
    }
    const formData = new FormData();
    Object.entries(this.createForm).forEach(([key, value]) => formData.append(key, String(value)));
    formData.append('statut', 'publie');
    formData.append('sujet', this.selectedFile);
    this.createError = '';
    this.devoirService.create(formData).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.createForm = { titre: '', description: '', dateLimite: '', coursId: '', semestre: 1, poids: 50 };
        this.selectedFile = null;
        this.loadDevoirs();
      },
      error: (error) => this.createError = error.error?.message || 'Impossible de créer le devoir.'
    });
  }

  deleteDevoir(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Supprimer ce devoir ?')) {
      this.devoirService.delete(id).subscribe({ next: () => this.loadDevoirs() });
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'à rendre': return 'yellow';
      case 'soumis': return 'blue';
      case 'noté': return 'green';
      default: return 'gray';
    }
  }

  canManage(): boolean {
    const token = localStorage.getItem(LocalStorageService.AUTH_TOKEN);
    if (!token) return false;
    this.jwtTokenService.setToken(token);
    const decoded: any = this.jwtTokenService.getDecodeToken();
    const role = decoded?.role;
    return role === 'institution' || role === 'admin' || role === 'enseignant';
  }
}
