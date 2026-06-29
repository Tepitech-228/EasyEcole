import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DeliberationService } from '../../services/deliberation.service';

@Component({
  selector: 'app-deliberation-detail-page',
  templateUrl: './deliberation-detail-page.component.html',
  styleUrls: ['./deliberation-detail-page.component.scss']
})
export class DeliberationDetailPageComponent extends BaseComponentClass implements OnInit {
  deliberation: any = null;
  resultats: any[] = [];
  loading: boolean = false;
  loadingResultats: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliberationService: DeliberationService,
  ) { super(); }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.charger(id);
    }
  }

  charger(id: number) {
    this.loading = true;
    this.deliberationService.getOne(id).subscribe({
      next: (res) => {
        this.deliberation = res;
        this.resultats = res?.resultats || [];
      },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  chargerResultats() {
    if (!this.deliberation?.id) return;
    this.loadingResultats = true;
    this.deliberationService.chargerResultats(this.deliberation.id).subscribe({
      next: () => {
        this.charger(this.deliberation.id);
      },
      error: () => this.loadingResultats = false,
      complete: () => this.loadingResultats = false
    });
  }

  mettreAJourDecision(resultatId: number, decision: string) {
    if (!this.deliberation?.id) return;
    this.deliberationService.mettreAJourDecision(this.deliberation.id, resultatId, decision).subscribe({
      next: () => {
        this.charger(this.deliberation.id);
      }
    });
  }

  cloturer() {
    if (!this.deliberation?.id) return;
    if (!confirm('Clôturer cette délibération ? Les décisions ne pourront plus être modifiées.')) return;
    this.deliberationService.cloturer(this.deliberation.id).subscribe({
      next: () => {
        this.charger(this.deliberation.id);
      }
    });
  }

  get nbAdmis(): number { return this.resultats.filter(r => r.decision === 'admis').length }
  get nbRattrapage(): number { return this.resultats.filter(r => r.decision === 'rattrapage').length }
  get nbRedouble(): number { return this.resultats.filter(r => r.decision === 'redouble').length }

  getTauxReussite(): string {
    if (!this.resultats.length) return '0.0';
    return ((this.nbAdmis / this.resultats.length) * 100).toFixed(1);
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'cloturee': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'en_cours': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      case 'planifiee': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'cloturee': return 'Clôturée';
      case 'en_cours': return 'En cours';
      case 'planifiee': return 'Planifiée';
      default: return statut;
    }
  }

  getDecisionClass(decision: string): string {
    switch (decision) {
      case 'admis': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'rattrapage': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      case 'redouble': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getDecisionLabel(decision: string): string {
    switch (decision) {
      case 'admis': return 'Admis';
      case 'rattrapage': return 'Rattrapage';
      case 'redouble': return 'Redouble';
      default: return decision;
    }
  }

  getMoyenneClass(moyenne: number): string {
    if (moyenne == null) return 'text-gray-300';
    if (moyenne >= 14) return 'text-green-700';
    if (moyenne >= 10) return 'text-amber-700';
    return 'text-red-700';
  }

  getMentionClass(mention: string): string {
    if (!mention) return 'bg-gray-50 text-gray-400';
    const m = mention.toLowerCase();
    if (m.includes('très')) return 'bg-green-50 text-green-700 ring-1 ring-green-200';
    if (m.includes('bien')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    if (m.includes('assez')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    if (m.includes('passable')) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    return 'bg-red-50 text-red-700 ring-1 ring-red-200';
  }

  retour(): void {
    this.router.navigate(['/bulletins/deliberations']);
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
