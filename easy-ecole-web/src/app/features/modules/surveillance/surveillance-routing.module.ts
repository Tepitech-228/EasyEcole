import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardSurveillantPageComponent } from './pages/dashboard-surveillant-page/dashboard-surveillant-page.component';

const routes: Routes = [
  { path: '', component: DashboardSurveillantPageComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SurveillanceRoutingModule { }
