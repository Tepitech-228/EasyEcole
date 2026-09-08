import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MonitoringPeriod } from '../../../../../data/modules/monitoring/models/monitoring.models';
import { MonitoringStateService } from '../../services/monitoring-state.service';

@Component({
  selector: 'app-monitoring-period-filter',
  templateUrl: './period-filter.component.html',
  styleUrls: ['./period-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodFilterComponent {
  @Input() periods: MonitoringPeriod[] = [];

  get currentPeriod(): MonitoringPeriod {
    return this.stateService.filters.period;
  }

  constructor(private stateService: MonitoringStateService) {}

  selectPeriod(period: MonitoringPeriod): void {
    this.stateService.setPeriod(period);
  }

  isCurrent(period: MonitoringPeriod): boolean {
    return this.currentPeriod.key === period.key;
  }

  onCustomChange(): void {
    this.stateService.setPeriod(this.currentPeriod);
  }
}
