import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeBulletinsPageComponent } from './pages/liste-bulletins-page/liste-bulletins-page.component';
import { GenererBulletinsPageComponent } from './pages/generer-bulletins-page/generer-bulletins-page.component';
import { DetailBulletinPageComponent } from './pages/detail-bulletin-page/detail-bulletin-page.component';
import { MonRelevePageComponent } from './pages/mon-releve-page/mon-releve-page.component';

const routes: Routes = [
  { path: '', component: ListeBulletinsPageComponent },
  { path: 'mon-releve', component: MonRelevePageComponent },
  { path: 'generer', component: GenererBulletinsPageComponent },
  { path: ':id', component: DetailBulletinPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BulletinsRoutingModule {}
