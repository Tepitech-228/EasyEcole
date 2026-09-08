import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MonitoringService } from 'src/app/data/modules/monitoring/services/monitoring.service';

@Component({
  selector: 'app-monitoring-section-page',
  templateUrl: './monitoring-section-page.component.html',
  styleUrls: ['./monitoring-section-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringSectionPageComponent implements OnInit, OnDestroy {
  title = 'Monitoring';
  section = '';
  loading = true;
  hasData = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private monitoring: MonitoringService) {}

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.section = data['section'] || '';
      this.title = data['title'] || 'Monitoring';
      this.loadSection();
    });
  }

  private loadSection(): void {
    this.loading = true;
    const request: Observable<any> | null = this.section === 'systeme'
      ? this.monitoring.getSystem(new Date(Date.now() - 86400000), new Date())
      : this.section === 'database' ? this.monitoring.getDatabase()
      : this.section === 'ocr' ? this.monitoring.getOcr()
      : this.section === 'queues' ? this.monitoring.getQueues()
      : this.section === 'storage' ? this.monitoring.getStorage()
      : this.section === 'docker' ? this.monitoring.getDocker()
      : this.section === 'errors' ? this.monitoring.getErrors(this.monitoringState())
      : this.section === 'alerts' ? this.monitoring.getAlerts()
      : this.section === 'apis' ? this.monitoring.getApis(this.monitoringState())
      : this.section === 'api-catalog' ? this.monitoring.getApiCatalog()
      : null;

    if (!request) { this.loading = false; return; }
    request.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.hasData = Array.isArray(data) ? data.length > 0 : !!data && Object.keys(data).length > 0;
      this.loading = false;
    });
  }

  private monitoringState(): any { return { period: { key: 'today', label: "Aujourd'hui", from: new Date(Date.now() - 86400000), to: new Date() } }; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
