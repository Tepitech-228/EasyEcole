import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhFormation } from 'src/app/data/modules/rh/models/RhFormation.model';
import { RhParticipationFormation } from 'src/app/data/modules/rh/models/RhParticipationFormation.model';
import { RhFormationService } from 'src/app/data/modules/rh/services/rh-formation.service';
import { RhParticipationFormationService } from 'src/app/data/modules/rh/services/rh-participation-formation.service';

// Statut participation — valeurs exactes de l'ENUM backend (RhParticipationFormation.statut)
export const PARTICIPATION_STATUTS: string[] = ['inscrit', 'terminé', 'abandon'];

@Component({
  selector: 'app-formation-details-page',
  templateUrl: './formation-details-page.component.html',
  styleUrls: ['./formation-details-page.component.scss']
})
export class FormationDetailsPageComponent implements OnInit {
  formationId: string | null = null;
  loading = true;
  formation: RhFormation | null = null;
  participations: RhParticipationFormation[] = [];

  participationStatuts = PARTICIPATION_STATUTS;

  constructor(
    private route: ActivatedRoute,
    private service: RhFormationService,
    private participationService: RhParticipationFormationService
  ) {}

  ngOnInit(): void {
    this.formationId = this.route.snapshot.paramMap.get('id');
    if (this.formationId) {
      this.loadFormation();
      this.loadParticipations();
    } else {
      this.loading = false;
    }
  }

  /** Détails GET /rh/formations/:id */
  loadFormation() {
    this.service.get(this.formationId!).subscribe({
      next: (data) => { this.formation = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  /** Participations associées à la formation (avec nom / statut de l'employé). */
  loadParticipations() {
    this.participationService.getAll().subscribe({
      next: (data) => {
        this.participations = (data || []).filter((p) => p.formationId === this.formationId);
      },
      error: () => { this.participations = []; }
    });
  }

  getStatutBadge(statut: string): string {
    const map: any = { inscrit: 'bg-blue-100 text-blue-700', 'terminé': 'bg-green-100 text-green-700', abandon: 'bg-red-100 text-red-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }

  getTypeBadge(type: string): string {
    const map: any = { interne: 'bg-indigo-100 text-indigo-700', externe: 'bg-teal-100 text-teal-700' };
    return map[type] || 'bg-gray-100 text-gray-700';
  }

  participantName(p: RhParticipationFormation): string {
    const e = p.employe;
    if (e?.prenoms || e?.nom) return [e.prenoms, e.nom].filter(Boolean).join(' ').trim();
    return e?.matricule || `Employé #${p.employeId}`;
  }
}