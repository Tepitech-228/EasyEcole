import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SurveillanceRoutingModule } from './surveillance-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ModernUiModule } from 'src/app/shared/modern-ui/modern-ui.module';
import { DashboardSurveillantPageComponent } from './pages/dashboard-surveillant-page/dashboard-surveillant-page.component';

@NgModule({
  declarations: [
    DashboardSurveillantPageComponent
  ],
  imports: [
    CommonModule,
    SurveillanceRoutingModule,
    SharedModule,
    ModernUiModule
  ]
})
export class SurveillanceModule { }
