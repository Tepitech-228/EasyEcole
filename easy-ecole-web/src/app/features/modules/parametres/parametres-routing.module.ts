import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MonComptePageComponent } from './pages/mon-compte-page/mon-compte-page.component';
import { MonProfilPageComponent } from './pages/mon-profil-page/mon-profil-page.component';

const routes: Routes = [
  { 
    path: 'profil',
    component: MonProfilPageComponent,
    pathMatch: 'full'
  },
  { 
    path: 'compte',
    component: MonComptePageComponent,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParametresRoutingModule { }
