import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GedPageComponent } from './pages/ged-page/ged-page.component';

const routes: Routes = [
  {
    path: '',
    component: GedPageComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GedRoutingModule { }
