import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-monitoring-score-gauge',
  templateUrl: './score-gauge.component.html',
  styleUrls: ['./score-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreGaugeComponent {
  @Input() value = 0;
  @Input() label = 'Score global';
  @Input() max = 100;
  @Input() unit = '/100';

  get color(): string {
    const pct = (this.value / this.max) * 100;
    if (pct >= 70) return '#10b981';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  }

  get circumference(): number {
    return 2 * Math.PI * 45;
  }

  get strokeDasharray(): string {
    const pct = Math.min(100, Math.max(0, (this.value / this.max) * 100));
    return `${(pct / 100) * this.circumference} ${this.circumference}`;
  }
}
