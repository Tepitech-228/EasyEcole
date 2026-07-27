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
  generatingPV: boolean = false;
  showCommentForm: boolean = false;
  commentForm: any = { commentaire: '', assiduite: '', situationFinanciere: '' };
  selectedResultat: any = null;

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
    if (this.deliberation.verrouille) {
      alert('Délibération verrouillée. Aucune modification autorisée.');
      return;
    }
    this.deliberationService.mettreAJourDecision(this.deliberation.id, resultatId, decision).subscribe({
      next: () => {
        this.charger(this.deliberation.id);
      },
      error: (err) => {
        console.error('Erreur mise à jour décision:', err);
        alert(err.error?.message || 'Erreur lors de la mise à jour de la décision');
      }
    });
  }

  openCommentForm(r: any) {
    this.selectedResultat = r;
    this.commentForm = {
      commentaire: r.commentaire || '',
      assiduite: r.assiduite || '',
      situationFinanciere: r.situationFinanciere || ''
    };
    this.showCommentForm = true;
  }

  saveComment() {
    if (!this.deliberation?.id || !this.selectedResultat) return;
    this.deliberationService.mettreAJourDecision(
      this.deliberation.id,
      this.selectedResultat.id,
      this.selectedResultat.decision,
      this.commentForm
    ).subscribe({
      next: () => {
        this.showCommentForm = false;
        this.selectedResultat = null;
        this.charger(this.deliberation.id);
      }
    });
  }

  cloturer() {
    if (!this.deliberation?.id) return;
    if (!confirm('Clôturer cette délibération ? Les décisions ne pourront plus être modifiées.')) return;
    this.deliberationService.cloturer(this.deliberation.id).subscribe({
      next: () => { this.charger(this.deliberation.id); }
    });
  }

  publier() {
    if (!this.deliberation?.id) return;
    if (!confirm('Publier cette délibération ? Les résultats seront visibles par les étudiants.')) return;
    this.deliberationService.publier(this.deliberation.id).subscribe({
      next: () => { this.charger(this.deliberation.id); }
    });
  }

  contester() {
    if (!this.deliberation?.id) return;
    if (!confirm('Marquer comme contestée ? La délibération sera déverrouillée pour modifications.')) return;
    this.deliberationService.contester(this.deliberation.id).subscribe({
      next: () => { this.charger(this.deliberation.id); }
    });
  }

  verrouiller() {
    if (!this.deliberation?.id) return;
    this.deliberationService.verrouiller(this.deliberation.id).subscribe({
      next: () => { this.charger(this.deliberation.id); }
    });
  }

  deverrouiller() {
    if (!this.deliberation?.id) return;
    this.deliberationService.deverrouiller(this.deliberation.id).subscribe({
      next: () => { this.charger(this.deliberation.id); }
    });
  }

  genererPV() {
    if (!this.deliberation?.id) return;
    this.generatingPV = true;
    this.deliberationService.genererPV(this.deliberation.id).subscribe({
      next: (res: any) => {
        this.generatingPV = false;
        const url = this.deliberationService.telechargerPV(res.filename);
        window.open(url, '_blank');
      },
      error: () => this.generatingPV = false
    });
  }

  get nbAdmis(): number { return this.resultats.filter(r => r.decision === 'admis').length }
  get nbRattrapage(): number { return this.resultats.filter(r => r.decision === 'rattrapage').length }
  get nbRedouble(): number { return this.resultats.filter(r => r.decision === 'redouble').length }
  get nbAdmisAvecDette(): number { return this.resultats.filter(r => r.decision === 'admis_avec_dette').length }
  get nbAjourne(): number { return this.resultats.filter(r => r.decision === 'ajourne').length }
  get nbExclu(): number { return this.resultats.filter(r => r.decision === 'exclu').length }
  get nbDerogation(): number { return this.resultats.filter(r => r.decision === 'derogation').length }

  getTauxReussite(): string {
    if (!this.resultats.length) return '0.0';
    const reussite = this.resultats.filter(r => r.decision === 'admis' || r.decision === 'admis_avec_dette').length;
    return ((reussite / this.resultats.length) * 100).toFixed(1);
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'publiee': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
      case 'contestee': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'cloturee': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'en_cours': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      case 'planifiee': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'publiee': return 'Publiée';
      case 'contestee': return 'Contestée';
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
      case 'redouble': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      case 'admis_avec_dette': return 'bg-teal-50 text-teal-700 ring-1 ring-teal-200';
      case 'ajourne': return 'bg-gray-100 text-gray-600 ring-1 ring-gray-300';
      case 'exclu': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'derogation': return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getDecisionLabel(decision: string): string {
    switch (decision) {
      case 'admis': return 'Admis';
      case 'rattrapage': return 'Rattrapage';
      case 'redouble': return 'Redoublement';
      case 'admis_avec_dette': return 'Admis avec dette';
      case 'ajourne': return 'Ajourné';
      case 'exclu': return 'Exclu';
      case 'derogation': return 'Dérogation';
      default: return decision;
    }
  }

  getMoyenneClass(moyenne: number): string {
    if (moyenne == null) return 'text-gray-300';
    if (moyenne >= 14) return 'text-green-700';
    if (moyenne >= 10) return 'text-amber-700';
    return 'text-blue-700';
  }

  getMentionClass(mention: string): string {
    if (!mention) return 'bg-gray-50 text-gray-400';
    const m = mention.toLowerCase();
    if (m.includes('très')) return 'bg-green-50 text-green-700 ring-1 ring-green-200';
    if (m.includes('bien')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    if (m.includes('assez')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    if (m.includes('passable')) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
  }

  retour(): void {
    this.router.navigate(['/bulletins/deliberations']);
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
