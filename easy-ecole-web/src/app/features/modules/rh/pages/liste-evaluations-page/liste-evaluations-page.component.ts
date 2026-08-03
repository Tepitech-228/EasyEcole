import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhFicheEvaluation } from 'src/app/data/modules/rh/models/RhFicheEvaluation.model';
import { RhFicheEvaluationService } from 'src/app/data/modules/rh/services/rh-fiche-evaluation.service';

@Component({
  selector: 'app-liste-evaluations-page',
  templateUrl: './liste-evaluations-page.component.html',
  styleUrls: ['./liste-evaluations-page.component.scss']
})
export class ListeEvaluationsPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  evaluations: RhFicheEvaluation[] = [];

  constructor(private service: RhFicheEvaluationService) { super() }

  ngOnInit(): void {
    this.loadEvaluations();
  }

  loadEvaluations() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.evaluations = data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  /** Nom affiché de l'employé évalué. */
  employeLabel(e: RhFicheEvaluation): string {
    const emp = e.employe;
    if (emp?.prenoms || emp?.nom) return [emp.prenoms, emp.nom].filter(Boolean).join(' ').trim();
    return emp?.matricule || `Employé #${e.employeId}`;
  }

  /** Statut : 'évaluée' si une note (globale ou moyenne) est calculée, sinon 'draft'. */
  getStatut(e: RhFicheEvaluation): string {
    return this.getNoteMoyenne(e) != null ? 'évaluée' : 'draft';
  }

  /** Moyenne calculée des notes par critère, sinon noteGlobale renseignée. */
  getNoteMoyenne(e: RhFicheEvaluation): number | null {
    const criteres = e.evaluationsCriteres;
    if (criteres && criteres.length > 0) {
      const sum = criteres.reduce((acc, c) => acc + (Number(c.note) || 0), 0);
      return Math.round((sum / criteres.length) * 100) / 100;
    }
    if (e.noteGlobale != null) return Number(e.noteGlobale);
    return null;
  }

  getNoteBadge(note: number | null): string {
    if (note == null) return 'bg-gray-100 text-gray-700';
    if (note >= 16) return 'bg-green-100 text-green-700';
    if (note >= 12) return 'bg-blue-100 text-blue-700';
    if (note >= 10) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'évaluée': 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }
}