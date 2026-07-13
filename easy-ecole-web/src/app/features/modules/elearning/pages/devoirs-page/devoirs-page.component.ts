import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DevoirService } from 'src/app/data/modules/elearning/services/devoir.service';
import { CoursEnLigneService } from 'src/app/data/modules/elearning/services/cours-en-ligne.service';

@Component({
  selector: 'app-devoirs-page',
  templateUrl: './devoirs-page.component.html',
  styleUrls: ['./devoirs-page.component.scss']
})
export class DevoirsPageComponent extends BaseComponentClass implements OnInit {
  devoirs: any[] = [];
  coursList: any[] = [];
  loading = true;
  showCreateModal = false;
  createForm: any = { titre: '', description: '', dateLimite: '', coursId: '' };

  constructor(
    private router: Router,
    private devoirService: DevoirService,
    private coursService: CoursEnLigneService
  ) {
    super();
  }

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
    this.showCreateModal = true;
  }

  createDevoir(): void {
    this.devoirService.create(this.createForm).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.createForm = { titre: '', description: '', dateLimite: '', coursId: '' };
        this.loadDevoirs();
      },
      error: () => {}
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

  canManage(): boolean { return this.rolesValue.isInstitution || this.rolesValue.isAdmin || this.rolesValue.isEnseignant; }
}
