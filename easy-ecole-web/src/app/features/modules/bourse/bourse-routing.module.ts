import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigurationsPageComponent } from './pages/configurations-page/configurations-page.component';
import { AttributionsPageComponent } from './pages/attributions-page/attributions-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'configurations', pathMatch: 'full' },
  { path: 'configurations', component: ConfigurationsPageComponent },
  { path: 'attributions', component: AttributionsPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BourseRoutingModule { }
