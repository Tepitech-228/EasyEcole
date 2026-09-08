import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MonitoringPageComponent } from './pages/monitoring-page/monitoring-page.component';
import { MonitoringSectionPageComponent } from './pages/monitoring-section-page/monitoring-section-page.component';

const routes: Routes = [
  { path: '', component: MonitoringPageComponent },
  { path: 'systeme', component: MonitoringSectionPageComponent, data: { section: 'systeme', title: 'Système' } },
  { path: 'apis', component: MonitoringSectionPageComponent, data: { section: 'apis', title: 'APIs' } },
  { path: 'apis/:id', component: MonitoringSectionPageComponent, data: { section: 'api-detail', title: 'Détail API' } },
  { path: 'base-de-donnees', component: MonitoringSectionPageComponent, data: { section: 'database', title: 'Base de données' } },
  { path: 'ocr', component: MonitoringSectionPageComponent, data: { section: 'ocr', title: 'OCR' } },
  { path: 'files', component: MonitoringSectionPageComponent, data: { section: 'queues', title: 'Files de traitement' } },
  { path: 'stockage', component: MonitoringSectionPageComponent, data: { section: 'storage', title: 'Stockage' } },
  { path: 'docker', component: MonitoringSectionPageComponent, data: { section: 'docker', title: 'Docker' } },
  { path: 'erreurs', component: MonitoringSectionPageComponent, data: { section: 'errors', title: 'Erreurs' } },
  { path: 'alertes', component: MonitoringSectionPageComponent, data: { section: 'alerts', title: 'Alertes' } },
  { path: 'catalogue-apis', component: MonitoringSectionPageComponent, data: { section: 'api-catalog', title: 'Catalogue des API' } },
  { path: 'exports', component: MonitoringSectionPageComponent, data: { section: 'exports', title: 'Exports' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MonitoringRoutingModule {}
