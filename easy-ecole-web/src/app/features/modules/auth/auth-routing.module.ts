import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnexionPageComponent } from './pages/connexion-page/connexion-page.component';
import { InscriptionPageComponent } from './pages/inscription-page/inscription-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { ConfirmEmailPageComponent } from './pages/confirm-email-page/confirm-email-page.component';
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
    canActivate: [AuthGuard]
  },
  {
    path: 'inscription',
    component: InscriptionPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'mot-de-passe-oublie',
    component: ForgotPasswordPageComponent,
  },
  {
    path: 'reinitialisation-mot-de-passe',
    component: ResetPasswordPageComponent,
  },
  {
    path: 'confirmation-email',
    component: ConfirmEmailPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
