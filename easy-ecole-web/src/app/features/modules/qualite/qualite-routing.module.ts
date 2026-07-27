import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NonConformitesPageComponent } from './pages/non-conformites-page/non-conformites-page.component';
import { AuditsPageComponent } from './pages/audits-page/audits-page.component';
import { RevuesDirectionPageComponent } from './pages/revues-direction-page/revues-direction-page.component';
import { EnquetesSatisfactionPageComponent } from './pages/enquetes-satisfaction-page/enquetes-satisfaction-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'non-conformites', pathMatch: 'full' },
  { path: 'non-conformites', component: NonConformitesPageComponent },
  { path: 'audits', component: AuditsPageComponent },
  { path: 'revues-direction', component: RevuesDirectionPageComponent },
  { path: 'enquetes-satisfaction', component: EnquetesSatisfactionPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QualiteRoutingModule { }
