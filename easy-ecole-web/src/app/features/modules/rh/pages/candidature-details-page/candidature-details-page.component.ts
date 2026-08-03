import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhCandidatureService } from 'src/app/data/modules/rh/services/rh-candidature.service';
import { RhCandidature } from 'src/app/data/modules/rh/models/RhCandidature.model';

@Component({
  selector: 'app-candidature-details-page',
  templateUrl: './candidature-details-page.component.html',
  styleUrls: ['./candidature-details-page.component.scss']
})
export class CandidatureDetailsPageComponent extends BaseComponentClass implements OnInit {
  candidatureId: string | null = null;
  candidature: RhCandidature | null = null;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private candidatureService: RhCandidatureService
  ) { super(); }

  ngOnInit(): void {
    this.candidatureId = this.route.snapshot.paramMap.get('id');
    if (this.candidatureId) {
      this.loadCandidature(this.candidatureId);
    }
  }

  loadCandidature(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.candidatureService.get(id).subscribe({
      next: (res) => { this.candidature = res; },
      error: (err) => { console.error(err); this.errorMessage = 'Impossible de charger la candidature.'; this.loading = false; },
      complete: () => this.loading = false
    });
  }

  changerStatut(nouveauStatut: string): void {
    if (!this.candidature || !this.candidature.id) return;
    const item = new RhCandidature();
    item.id = this.candidature.id;
    item.statut = nouveauStatut;
    this.candidatureService.update(item).subscribe({
      next: () => this.loadCandidature(this.candidature!.id!),
      error: (err) => { console.error(err); this.errorMessage = 'Erreur lors du changement de statut.'; }
    });
  }

  getOffreTitre(): string {
    const c = this.candidature;
    if (!c) return '-';
    if (c.offre && c.offre.poste && c.offre.poste.titre) return c.offre.poste.titre;
    return 'Offre #' + (c.offreId || '-');
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'soumise': 'bg-yellow-100 text-yellow-700', 'étudiée': 'bg-blue-100 text-blue-700', 'retenue': 'bg-green-100 text-green-700', 'rejetée': 'bg-red-100 text-red-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }

  getEntries(entretiens: any[] | undefined): any[] {
    return entretiens || [];
  }
}