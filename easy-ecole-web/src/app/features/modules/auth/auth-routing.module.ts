import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnexionPageComponent } from './pages/connexion-page/connexion-page.component';
import { InscriptionPageComponent } from './pages/inscription-page/inscription-page.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'connexion',
    pathMatch: 'full'
  },
  {
    path: 'connexion',
    component: ConnexionPageComponent,
    pathMatch: 'full',
    canActivate: [AuthGuard]
  },
  {
    path: 'inscription',
    component: InscriptionPageComponent,
    pathMatch: 'full',
    canActivate: [AuthGuard]
  },
  // {
  //   path: 'confirmation-email',
  //   component: ConfirmEmailPageComponent,
  //   pathMatch: 'full',
  //   canActivate: [DeveloperGuard, EmailConfirmationGuard]
  // },
  // {
  //   path: 'confirmation',
  //   component: EmailConfirmationPageComponent,
  //   pathMatch: 'full',
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
