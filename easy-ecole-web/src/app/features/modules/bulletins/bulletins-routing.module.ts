import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeBulletinsPageComponent } from './pages/liste-bulletins-page/liste-bulletins-page.component';
import { GenererBulletinsPageComponent } from './pages/generer-bulletins-page/generer-bulletins-page.component';
import { DetailBulletinPageComponent } from './pages/detail-bulletin-page/detail-bulletin-page.component';
import { MonRelevePageComponent } from './pages/mon-releve-page/mon-releve-page.component';
import { EchellesPageComponent } from './pages/echelles-page/echelles-page.component';
import { EchelleFormPageComponent } from './pages/echelle-form-page/echelle-form-page.component';
import { DeliberationsPageComponent } from './pages/deliberations-page/deliberations-page.component';
import { DeliberationDetailPageComponent } from './pages/deliberation-detail-page/deliberation-detail-page.component';
import { ParametresBulletinsPageComponent } from './pages/parametres-bulletins-page/parametres-bulletins-page.component';
import { MoyennesPageComponent } from './pages/moyennes-page/moyennes-page.component';

const routes: Routes = [
  { path: '', component: ListeBulletinsPageComponent },
  { path: 'mon-releve', component: MonRelevePageComponent },
  { path: 'generer', component: GenererBulletinsPageComponent },
  { path: 'echelles', component: EchellesPageComponent },
  { path: 'echelles/nouveau', component: EchelleFormPageComponent },
  { path: 'echelles/:id', component: EchelleFormPageComponent },
  { path: 'deliberations', component: DeliberationsPageComponent },
  { path: 'deliberations/:id', component: DeliberationDetailPageComponent },
  { path: 'parametres', component: ParametresBulletinsPageComponent },
  { path: 'moyennes', component: MoyennesPageComponent },
  { path: ':id', component: DetailBulletinPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BulletinsRoutingModule {}
