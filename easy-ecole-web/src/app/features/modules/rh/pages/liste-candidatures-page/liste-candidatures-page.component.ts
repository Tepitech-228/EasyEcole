import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhCandidatureService } from 'src/app/data/modules/rh/services/rh-candidature.service';
import { RhCandidature } from 'src/app/data/modules/rh/models/RhCandidature.model';

@Component({
  selector: 'app-liste-candidatures-page',
  templateUrl: './liste-candidatures-page.component.html',
  styleUrls: ['./liste-candidatures-page.component.scss']
})
export class ListeCandidaturesPageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = false;
  candidatures: RhCandidature[] = [];
  filterStatut: string = '';
  searchTerm: string = '';
  errorMessage: string = '';

  constructor(
    private candidatureService: RhCandidatureService,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    this.loadCandidatures();
  }

  loadCandidatures(): void {
    this.loading = true;
    this.errorMessage = '';
    this.candidatureService.getAll().subscribe({
      next: (res) => { this.candidatures = res; },
      error: (err) => { console.error(err); this.errorMessage = 'Impossible de charger les candidatures.'; this.loading = false; },
      complete: () => this.loading = false
    });
  }

  get filteredCandidatures(): RhCandidature[] {
    let list = this.candidatures;
    if (this.filterStatut) {
      list = list.filter(c => c.statut === this.filterStatut);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      list = list.filter(c =>
        (c.nom && c.nom.toLowerCase().includes(term)) ||
        (this.getOffreTitre(c).toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }
    return list;
  }

  getOffreTitre(c: RhCandidature): string {
    if (c.offre && c.offre.poste && c.offre.poste.titre) return c.offre.poste.titre;
    if (c.offre && (c.offre as any).posteId) return String((c.offre as any).posteId);
    return 'Offre #' + (c.offreId || '-');
  }

  changerStatut(candidature: RhCandidature, nouveauStatut: string): void {
    const item = new RhCandidature();
    item.id = candidature.id;
    item.statut = nouveauStatut;
    this.candidatureService.update(item).subscribe({
      next: () => this.loadCandidatures(),
      error: (err) => { console.error(err); this.errorMessage = 'Erreur lors du changement de statut.'; }
    });
  }

  voirDetail(id?: string): void {
    if (!id) return;
    this.router.navigate(['/rh/candidatures', id]);
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'soumise': 'bg-yellow-100 text-yellow-700', 'étudiée': 'bg-blue-100 text-blue-700', 'retenue': 'bg-green-100 text-green-700', 'rejetée': 'bg-red-100 text-red-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }

  trackByFn(index: number, item: RhCandidature): any { return item.id; }
}