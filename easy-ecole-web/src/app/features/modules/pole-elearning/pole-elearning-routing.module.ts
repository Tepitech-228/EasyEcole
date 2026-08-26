import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PoleElearningHomeComponent } from './pages/pole-elearning-home/pole-elearning-home.component';

const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { path: 'accueil', component: PoleElearningHomeComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PoleElearningRoutingModule { }
