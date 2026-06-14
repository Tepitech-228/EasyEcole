import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { ConnexionPageComponent } from './pages/connexion-page/connexion-page.component';
import { InscriptionPageComponent } from './pages/inscription-page/inscription-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthLayoutComponent } from './components/auth-layout/auth-layout.component';


@NgModule({
  declarations: [
    ConnexionPageComponent,
    InscriptionPageComponent,
    AuthLayoutComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    SharedModule
  ]
})
export class AuthModule { }
