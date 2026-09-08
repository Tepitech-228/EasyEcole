import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { ModernUiModule } from 'src/app/shared/modern-ui/modern-ui.module';
import { MonitoringRoutingModule } from './monitoring-routing.module';
import { MonitoringPageComponent } from './pages/monitoring-page/monitoring-page.component';
import { MonitoringSectionPageComponent } from './pages/monitoring-section-page/monitoring-section-page.component';
import { HealthBadgeComponent } from './components/health-badge/health-badge.component';
import { PeriodFilterComponent } from './components/period-filter/period-filter.component';
import { ThresholdGaugeComponent } from './components/threshold-gauge/threshold-gauge.component';
import { ScoreGaugeComponent } from './components/score-gauge/score-gauge.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';

@NgModule({
  declarations: [
    MonitoringPageComponent,
    MonitoringSectionPageComponent,
    HealthBadgeComponent,
    PeriodFilterComponent,
    ThresholdGaugeComponent,
    ScoreGaugeComponent,
    EmptyStateComponent,
  ],
  imports: [CommonModule, SharedModule, ModernUiModule, MonitoringRoutingModule],
})
export class MonitoringModule {}
