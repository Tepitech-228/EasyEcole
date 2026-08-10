import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhReportingService } from 'src/app/data/modules/rh/services/rh-reporting.service';

@Component({
  selector: 'app-reporting-rh-page',
  templateUrl: './reporting-rh-page.component.html',
  styleUrls: ['./reporting-rh-page.component.scss']
})
export class ReportingRhPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  errorMessage: string | null = null;

  stats: any = null;
  masseSalariale: any = null;
  effectifs: any = null;
  situationPrets: any = null;

  constructor(private reportingService: RhReportingService) { super() }

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    this.errorMessage = null;

    this.reportingService.getStats().subscribe({
      next: (data) => { this.stats = data; },
      error: () => { this.errorMessage = 'Impossible de charger les statistiques.'; }
    });

    this.reportingService.getMasseSalariale().subscribe({
      next: (data) => { this.masseSalariale = data; },
      error: () => { this.errorMessage = 'Impossible de charger la masse salariale.'; }
    });

    this.reportingService.getEffectifs().subscribe({
      next: (data) => { this.effectifs = data; },
      error: () => { this.errorMessage = 'Impossible de charger les effectifs.'; }
    });

    this.reportingService.getSituationPrets().subscribe({
      next: (data) => { this.situationPrets = data; this.loading = false; },
      error: () => { this.errorMessage = 'Impossible de charger la situation des prêts.'; this.loading = false; }
    });
  }

  get totalEmployes(): number {
    return this.effectifs?.total || this.stats?.totalEmployes || 0;
  }

  get masseSalarialeMontant(): number {
    return this.masseSalariale?.montant || this.stats?.masseSalariale || 0;
  }

  get heuresSupCount(): number {
    return this.stats?.heuresSupCount || 0;
  }

  get heuresSupTotal(): number {
    return this.stats?.heuresSupTotal || 0;
  }

  get pretsEnCours(): number {
    return this.situationPrets?.enCours || this.stats?.pretsEnCours || 0;
  }

  get pretsCount(): number {
    return this.situationPrets?.total || this.stats?.pretsCount || 0;
  }
}
