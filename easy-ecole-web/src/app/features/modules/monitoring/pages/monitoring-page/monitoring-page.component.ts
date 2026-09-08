import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { MonitoringOverview } from 'src/app/data/modules/monitoring/models/monitoring.models';
import { MonitoringService } from 'src/app/data/modules/monitoring/services/monitoring.service';

@Component({
  selector: 'app-monitoring-page',
  templateUrl: './monitoring-page.component.html',
  styleUrls: ['./monitoring-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringPageComponent implements OnInit, OnDestroy {
  overview: MonitoringOverview | null = null;
  loading = true;
  error = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private monitoring: MonitoringService, private changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    interval(60000).pipe(
      startWith(0),
      switchMap(() => this.monitoring.getOverview()),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (overview) => {
        this.overview = overview;
        this.loading = false;
        this.error = !overview || overview.modules.length === 0;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.changeDetector.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById(_: number, item: { id: string }): string { return item.id; }
}
