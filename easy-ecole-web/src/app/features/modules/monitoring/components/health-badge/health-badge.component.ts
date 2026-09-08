import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { HealthStatus } from '../../../../../data/modules/monitoring/models/monitoring.models';

@Component({
  selector: 'app-monitoring-health-badge',
  templateUrl: './health-badge.component.html',
  styleUrls: ['./health-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthBadgeComponent {
  @Input() status: HealthStatus = 'unknown';

  get label(): string {
    const map: Record<HealthStatus, string> = {
      ok: 'OK',
      attention: 'ATTENTION',
      critical: 'CRITIQUE',
      unknown: 'INDISPONIBLE',
    };
    return map[this.status];
  }

  get color(): string {
    const map: Record<HealthStatus, string> = {
      ok: '#10b981',
      attention: '#f59e0b',
      critical: '#ef4444',
      unknown: '#6b7280',
    };
    return map[this.status];
  }

  get icon(): string {
    const map: Record<HealthStatus, string> = {
      ok: 'check_circle',
      attention: 'warning',
      critical: 'error',
      unknown: 'block',
    };
    return map[this.status];
  }
}
