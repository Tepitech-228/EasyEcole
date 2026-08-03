import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhOffreEmploiService } from 'src/app/data/modules/rh/services/rh-offre-emploi.service';
import { RhCandidatureService } from 'src/app/data/modules/rh/services/rh-candidature.service';
import { RhOffreEmploi } from 'src/app/data/modules/rh/models/RhOffreEmploi.model';

@Component({
  selector: 'app-offre-details-page',
  templateUrl: './offre-details-page.component.html',
  styleUrls: ['./offre-details-page.component.scss']
})
export class OffreDetailsPageComponent extends BaseComponentClass implements OnInit {
  offreId: string | null = null;
  offre: RhOffreEmploi | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  // Statistiques : base brute sur les candidatures de l'offre (si chargées)
  candidatureCount: number = 0;
  candidatureRetenues: number = 0;

  constructor(
    private route: ActivatedRoute,
    private offreService: RhOffreEmploiService,
    private candidatureService: RhCandidatureService
  ) { super(); }

  ngOnInit(): void {
    this.offreId = this.route.snapshot.paramMap.get('id');
    if (this.offreId) {
      this.loadOffre(this.offreId);
      this.loadCandidatures();
    }
  }

  loadOffre(id: string): void {
    this.loading = true;
    this.offreService.get(id).subscribe({
      next: (res) => {
        this.offre = res;
        this.candidatureCount = (res.candidatures && res.candidatures.length) ? res.candidatures.length : 0;
      },
      error: (err) => { console.error(err); this.errorMessage = 'Impossible de charger l\'offre.'; this.loading = false; },
      complete: () => this.loading = false
    });
  }

  loadCandidatures(): void {
    this.candidatureService.getAll().subscribe({
      next: (res) => {
        const related = res.filter(c => c.offreId === this.offreId);
        this.candidatureCount = related.length;
        this.candidatureRetenues = related.filter(c => c.statut === 'retenue').length;
      },
      error: (err) => console.error(err)
    });
  }

  getPosteTitre(): string {
    return (this.offre && this.offre.poste && this.offre.poste.titre) ? this.offre.poste.titre : '-';
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'publiée': 'bg-green-100 text-green-700', 'fermée': 'bg-red-100 text-red-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }
}