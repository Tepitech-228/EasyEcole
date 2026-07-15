import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevoirService } from 'src/app/data/modules/elearning/services/devoir.service';
import { JwtTokenService } from 'src/app/core/services/jwt-token.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

@Component({
  selector: 'app-devoir-detail-page',
  templateUrl: './devoir-detail-page.component.html',
  styleUrls: ['./devoir-detail-page.component.scss']
})
export class DevoirDetailPageComponent implements OnInit {
  devoir: any = null;
  loading = true;
  selectedFile: File | null = null;
  submitSuccess = false;
  showNoterModal = false;
  selectedSoumissionId: string = '';
  noteValue: number = 0;
  soumissions: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devoirService: DevoirService,
    private jwtTokenService: JwtTokenService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadDevoir(id);
  }

  loadDevoir(id: string): void {
    this.loading = true;
    this.devoirService.get(id).subscribe({
      next: (data) => {
        this.devoir = data;
        this.soumissions = data.soumissions || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  soumettre(): void {
    if (!this.selectedFile) return;
    const fd = new FormData();
    fd.append('fichier', this.selectedFile);
    this.devoirService.soumettre(this.devoir.id, fd).subscribe({
      next: () => { this.submitSuccess = true; this.loadDevoir(this.devoir.id); }
    });
  }

  openNoterModal(soumissionId: string): void {
    this.selectedSoumissionId = soumissionId;
    this.noteValue = 0;
    this.showNoterModal = true;
  }

  noterSoumission(): void {
    this.devoirService.noter(this.devoir.id, this.selectedSoumissionId, { note: this.noteValue }).subscribe({
      next: () => { this.showNoterModal = false; this.loadDevoir(this.devoir.id); }
    });
  }

  downloadSoumission(soumissionId: string): void {
    this.devoirService.downloadSoumission(this.devoir.id, soumissionId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  goBack(): void { this.router.navigate(['/elearning/devoirs']); }

  canSubmit(): boolean {
    const roleComputed = this.getRole();
    return (this.devoir?.statut === 'à rendre' || !this.devoir?.statut) && roleComputed === 'apprenant';
  }

  isLate(): boolean { return this.devoir && new Date(this.devoir.dateLimite) < new Date(); }

  canManage(): boolean {
    const token = localStorage.getItem(LocalStorageService.AUTH_TOKEN);
    if (!token) return false;
    this.jwtTokenService.setToken(token);
    const decoded: any = this.jwtTokenService.getDecodeToken();
    const role = decoded?.role;
    return role === 'institution' || role === 'admin' || role === 'enseignant';
  }

  private getRole(): string | null {
    const token = localStorage.getItem(LocalStorageService.AUTH_TOKEN);
    if (!token) return null;
    this.jwtTokenService.setToken(token);
    const decoded: any = this.jwtTokenService.getDecodeToken();
    return decoded?.role || null;
  }
}
