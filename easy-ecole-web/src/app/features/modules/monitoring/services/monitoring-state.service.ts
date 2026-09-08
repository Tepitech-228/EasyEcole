import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  MonitoringFilters,
  MonitoringPeriod,
} from '../../../../data/modules/monitoring/models/monitoring.models';

/**
 * Service d'état partagé du module Monitoring.
 *
 * Garantit que toutes les pages et l'export partagent les mêmes filtres
 * (période, module, catégorie, méthode, niveau d'erreur).
 * Utilise un BehaviorSubject pour diffuser l'état courant à tous les
 * abonnés en temps réel.
 */
@Injectable({ providedIn: 'root' })
export class MonitoringStateService {
  private readonly DEFAULT_PERIOD: MonitoringPeriod = {
    key: 'today',
    label: "Aujourd'hui",
    from: new Date(),
    to: new Date(),
  };

  private readonly DEFAULT_FILTERS: MonitoringFilters = {
    period: this.DEFAULT_PERIOD,
  };

  private readonly filtersSubject = new BehaviorSubject<MonitoringFilters>(
    this.DEFAULT_FILTERS
  );

  /** Observable sur les filtres actuels. */
  readonly filters$: Observable<MonitoringFilters> = this.filtersSubject.asObservable();

  /** Valeur courante des filtres (synchron). */
  get filters(): MonitoringFilters {
    return this.filtersSubject.getValue();
  }

  /** Met à jour les filtres avec un patch partiel. */
  setFilters(patch: Partial<MonitoringFilters>): void {
    const current = this.filtersSubject.getValue();
    this.filtersSubject.next({ ...current, ...patch });
  }

  /** Réinitialise les filtres aux valeurs par défaut. */
  reset(): void {
    this.filtersSubject.next(this.DEFAULT_FILTERS);
  }

  /** Met à jour uniquement la période. */
  setPeriod(period: MonitoringPeriod): void {
    this.setFilters({ period });
  }
}
