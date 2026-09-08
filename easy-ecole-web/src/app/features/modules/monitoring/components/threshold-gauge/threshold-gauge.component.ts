import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

interface ThresholdLevels {
  ok: number;
  attention: number;
  critical: number;
}

@Component({
  selector: 'app-monitoring-threshold-gauge',
  templateUrl: './threshold-gauge.component.html',
  styleUrls: ['./threshold-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThresholdGaugeComponent {
  @Input() value = 0;
  @Input() label = '';
  @Input() unit = '';
  @Input() thresholds: ThresholdLevels = { ok: 70, attention: 85, critical: 95 };

  get color(): string {
    if (this.value >= this.thresholds.critical) return '#ef4444';
    if (this.value >= this.thresholds.attention) return '#f59e0b';
    return '#10b981';
  }

  get levelLabel(): string {
    if (this.value >= this.thresholds.critical) return 'Critique';
    if (this.value >= this.thresholds.attention) return 'Attention';
    return 'OK';
  }

  get circumference(): number {
    return 2 * Math.PI * 40;
  }

  get strokeDasharray(): string {
    const pct = Math.min(100, Math.max(0, this.value));
    return `${(pct / 100) * this.circumference} ${this.circumference}`;
  }
}
