import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { FeuillePresenceService } from '../../services/feuille-presence.service';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';

@Component({
  selector: 'app-feuille-presence-page',
  templateUrl: './feuille-presence-page.component.html',
  styleUrls: ['./feuille-presence-page.component.scss']
})
export class FeuillePresencePageComponent extends BaseComponentClass implements OnInit {
  classes: Classe[] = [];
  seances: any[] = [];
  selectedSeanceId: number | null = null;
  selectedSeance: any = null;
  presences: any[] = [];
  loading: boolean = false;
  loadingSeances: boolean = false;
  loadingPresences: boolean = false;
  generating: boolean = false;
  filtre: any = { classeId: '', date: '' };
  errorMessage: string = '';
  successMessage: string = '';
  selectAll: boolean = false;

  constructor(
    private router: Router,
    private feuillePresenceService: FeuillePresenceService,
    private seanceService: SeanceService,
    private classeService: ClasseService,
  ) { super(); }

  ngOnInit(): void {
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.chargerSeances();
  }

  chargerSeances() {
    this.loadingSeances = true;
    this.seanceService.getAll().subscribe({
      next: (data) => {
        this.seances = Array.isArray(data) ? data : [];
        this.loadingSeances = false;
      },
      error: () => this.loadingSeances = false
    });
  }

  onSeanceChange() {
    if (!this.selectedSeanceId) {
      this.selectedSeance = null;
      this.presences = [];
      return;
    }
    this.selectedSeance = this.seances.find(s => s.id === Number(this.selectedSeanceId));
    this.chargerPresences();
  }

  chargerPresences() {
    if (!this.selectedSeanceId) return;
    this.loadingPresences = true;
    this.errorMessage = '';
    this.feuillePresenceService.getPresencesParSeance(this.selectedSeanceId).subscribe({
      next: (res) => {
        this.presences = Array.isArray(res) ? res : (res?.data || []);
        this.loadingPresences = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des présences';
        this.loadingPresences = false;
      }
    });
  }

  genererPresences() {
    if (!this.selectedSeanceId) return;
    this.generating = true;
    this.errorMessage = '';
    this.feuillePresenceService.genererPresences(this.selectedSeanceId).subscribe({
      next: () => {
        this.successMessage = 'Présences générées avec succès';
        this.generating = false;
        this.chargerPresences();
      },
      error: (err) => {
        this.errorMessage = "Erreur lors de la génération des présences. Vérifiez que la séance a des participants inscrits.";
        this.generating = false;
      }
    });
  }

  togglePresence(presence: any) {
    if (!presence.id) return;
    const etats: string[] = ['present', 'absent', 'justifie'];
    const current = etats.indexOf(presence.etat);
    const next = etats[(current + 1) % etats.length];
    presence.etat = next;
    presence._updating = true;
    this.feuillePresenceService.mettreAJourEtat(presence.id, next).subscribe({
      next: () => presence._updating = false,
      error: () => presence._updating = false
    });
  }

  setPresence(presence: any, etat: string) {
    if (!presence.id) return;
    presence.etat = etat;
    presence._updating = true;
    this.feuillePresenceService.mettreAJourEtat(presence.id, etat).subscribe({
      next: () => presence._updating = false,
      error: () => presence._updating = false
    });
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.presences.forEach(p => p._selected = this.selectAll);
  }

  hasSelectedPresences(): boolean {
    return this.presences.some(p => p._selected);
  }

  actionMassive(etat: string) {
    const ids = this.presences.filter(p => p._selected).map(p => p.id);
    if (!ids.length) return;
    this.feuillePresenceService.mettreAJourMassive({ ids, etat }).subscribe({
      next: () => {
        this.successMessage = `${ids.length} présences mises à jour (${etat})`;
        this.selectAll = false;
        this.chargerPresences();
      },
      error: () => this.errorMessage = 'Erreur lors de la mise à jour massive'
    });
  }

  getEtatClass(etat: string): string {
    switch (etat) {
      case 'present': return 'bg-green-100 text-green-800 ring-1 ring-green-300';
      case 'absent': return 'bg-red-100 text-red-800 ring-1 ring-red-300';
      case 'justifie': return 'bg-amber-100 text-amber-800 ring-1 ring-amber-300';
      default: return 'bg-gray-100 text-gray-500 ring-1 ring-gray-200';
    }
  }

  getEtatIcon(etat: string): string {
    switch (etat) {
      case 'present': return 'check-circle';
      case 'absent': return 'x-circle';
      case 'justifie': return 'clock';
      default: return 'minus-circle';
    }
  }

  get nbPresent(): number { return this.presences.filter(p => p.etat === 'present').length; }
  get nbAbsent(): number { return this.presences.filter(p => p.etat === 'absent').length; }
  get nbJustifie(): number { return this.presences.filter(p => p.etat === 'justifie').length; }
  get nbNonRenseigne(): number { return this.presences.filter(p => !p.etat || p.etat === 'non_renseigne').length; }

  trackByFn(index: number, item: any): number { return item.id || index; }

  retour() {
    this.router.navigate(['/bulletins']);
  }
}
