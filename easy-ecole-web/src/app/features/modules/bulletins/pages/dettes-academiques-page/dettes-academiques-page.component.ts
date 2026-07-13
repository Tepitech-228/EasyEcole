import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DeliberationService } from '../../services/deliberation.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';

@Component({
  selector: 'app-dettes-academiques-page',
  templateUrl: './dettes-academiques-page.component.html',
  styleUrls: ['./dettes-academiques-page.component.scss']
})
export class DettesAcademiquesPageComponent extends BaseComponentClass implements OnInit {
  deliberations: any[] = [];
  selectedDeliberationId: number | null = null;
  selectedDeliberation: any = null;
  resultats: any[] = [];
  loading: boolean = false;
  loadingResultats: boolean = false;
  errorMessage: string = '';
  classes: Classe[] = [];
  filtre: any = { classeId: '', statut: '' };

  constructor(
    private router: Router,
    private deliberationService: DeliberationService,
    private classeService: ClasseService,
  ) { super(); }

  ngOnInit(): void {
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.chargerDeliberations();
  }

  chargerDeliberations() {
    this.loading = true;
    this.deliberationService.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.deliberations = res?.data || (Array.isArray(res) ? res : []);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onDeliberationChange() {
    if (!this.selectedDeliberationId) {
      this.selectedDeliberation = null;
      this.resultats = [];
      return;
    }
    this.loadingResultats = true;
    this.deliberationService.getOne(this.selectedDeliberationId).subscribe({
      next: (res) => {
        this.selectedDeliberation = res;
        this.resultats = (res?.resultats || []).filter((r: any) =>
          r.decision === 'admis_avec_dette' || r.credits > 0
        );
        this.loadingResultats = false;
      },
      error: () => this.loadingResultats = false
    });
  }

  get getDettes(): any[] {
    return this.resultats.filter(r => r.decision === 'admis_avec_dette');
  }

  get getCreditsInsuffisants(): any[] {
    return this.resultats.filter(r => r.decision !== 'admis_avec_dette' && (r.credits || 0) < (r.creditsRequis || 0));
  }

  get nbDettes(): number { return this.getDettes.length; }
  get nbCreditsInsuffisants(): number { return this.getCreditsInsuffisants.length; }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'resorbee': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'active': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'partielle': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getDecisionClass(decision: string): string {
    switch (decision) {
      case 'admis_avec_dette': return 'bg-teal-50 text-teal-700 ring-1 ring-teal-200';
      case 'rattrapage': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      case 'redouble': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getDecisionLabel(decision: string): string {
    switch (decision) {
      case 'admis_avec_dette': return 'Admis avec dette';
      case 'rattrapage': return 'Rattrapage';
      case 'redouble': return 'Redoublement';
      default: return decision;
    }
  }

  trackByFn(index: number, item: any): number { return item.id || index; }

  retour() {
    this.router.navigate(['/bulletins/deliberations']);
  }
}
