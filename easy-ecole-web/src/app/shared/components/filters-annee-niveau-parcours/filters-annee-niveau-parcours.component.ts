import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';

export interface FilterValue {
  anneeId: string;
  niveauId: string;
  parcoursId: string;
}

@Component({
  selector: 'app-filters-annee-niveau-parcours',
  templateUrl: './filters-annee-niveau-parcours.component.html',
  styleUrls: ['./filters-annee-niveau-parcours.component.scss']
})
export class FiltersAnneeNiveauParcoursComponent implements OnChanges {
  @Input() annees: AnneeAcademique[] = [];
  @Input() niveaux: NiveauEtude[] = [];
  @Input() parcoursList: Parcours[] = [];
  @Input() sessions: Session[] = [];
  @Input() loading: boolean = false;
  @Input() showResultCount: boolean = true;
  @Input() resultCount: number = 0;
  @Input() resultLabel: string = 'résultat(s)';

  @Output() filterChange = new EventEmitter<FilterValue>();

  selectedAnneeId: string = '';
  selectedNiveauId: string = '';
  selectedParcoursId: string = '';

  niveauxFiltres: NiveauEtude[] = [];
  parcoursFiltres: Parcours[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessions'] || changes['niveaux'] || changes['parcoursList']) {
      this.syncCascadingLists();
    }
  }

  private syncCascadingLists(): void {
    this.selectedNiveauId = '';
    this.selectedParcoursId = '';
    this.niveauxFiltres = [];
    this.parcoursFiltres = [];

    if (this.selectedAnneeId && this.sessions.length > 0) {
      const niveauIds = new Set<string>();
      this.sessions
        .filter(s => s.anneeAcademiqueId && String(s.anneeAcademiqueId) === String(this.selectedAnneeId))
        .forEach(s => {
          if (s.niveauEtudeId) niveauIds.add(String(s.niveauEtudeId));
        });

      if (niveauIds.size > 0) {
        this.niveauxFiltres = this.niveaux.filter(n => niveauIds.has(String(n.id!)));
      } else {
        this.niveauxFiltres = this.niveaux;
      }
    }
  }

  onAnneeChange(): void {
    this.syncCascadingLists();
    this.emitChange();
  }

  onNiveauChange(): void {
    this.selectedParcoursId = '';
    this.parcoursFiltres = [];

    if (this.selectedNiveauId) {
      this.parcoursFiltres = this.parcoursList.filter(p =>
        String(p.niveauEtudeId) === String(this.selectedNiveauId)
      );
      if (this.parcoursFiltres.length === 0) {
        this.parcoursFiltres = this.parcoursList;
      }
    }
    this.emitChange();
  }

  onParcoursChange(): void {
    this.emitChange();
  }

  effacerFiltres(): void {
    this.selectedAnneeId = '';
    this.selectedNiveauId = '';
    this.selectedParcoursId = '';
    this.niveauxFiltres = [];
    this.parcoursFiltres = [];
    this.emitChange();
  }

  get hasActiveFilters(): boolean {
    return !!(this.selectedAnneeId || this.selectedNiveauId || this.selectedParcoursId);
  }

  getAnneeLibelle(id: string): string {
    return this.annees.find(a => a.id === id)?.libelle || id;
  }

  getNiveauLibelle(id: string): string {
    return this.niveaux.find(n => n.id === id)?.libelle || id;
  }

  getParcoursTitre(id: string): string {
    return this.parcoursList.find(p => p.id === id)?.titre || id;
  }

  private emitChange(): void {
    this.filterChange.emit({
      anneeId: this.selectedAnneeId,
      niveauId: this.selectedNiveauId,
      parcoursId: this.selectedParcoursId
    });
  }
}
