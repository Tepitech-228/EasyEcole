import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth-routing.module';
import { ConnexionPageComponent } from './pages/connexion-page/connexion-page.component';
import { InscriptionPageComponent } from './pages/inscription-page/inscription-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { ConfirmEmailPageComponent } from './pages/confirm-email-page/confirm-email-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthLayoutComponent } from './components/auth-layout/auth-layout.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ConnexionPageComponent,
    InscriptionPageComponent,
    ForgotPasswordPageComponent,
    ResetPasswordPageComponent,
    ConfirmEmailPageComponent,
    AuthLayoutComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class AuthModule { }
