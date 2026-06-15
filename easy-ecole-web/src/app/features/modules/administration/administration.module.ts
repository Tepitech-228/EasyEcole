import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdministrationRoutingModule } from './administration-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { QrCodesPageComponent } from './pages/qr-codes-page/qr-codes-page.component';
import { EnseignantQrCodesPageComponent } from './pages/enseignant-qr-codes-page/enseignant-qr-codes-page.component';
import { CartesPageComponent } from './pages/cartes-page/cartes-page.component';

@NgModule({
  declarations: [
    QrCodesPageComponent,
    EnseignantQrCodesPageComponent,
    CartesPageComponent
  ],
  imports: [
    CommonModule,
    AdministrationRoutingModule,
    SharedModule
  ]
})
export class AdministrationModule { }
