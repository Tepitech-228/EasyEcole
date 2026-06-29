import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdministrationRoutingModule } from './administration-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { QrCodesPageComponent } from './pages/qr-codes-page/qr-codes-page.component';
import { EnseignantQrCodesPageComponent } from './pages/enseignant-qr-codes-page/enseignant-qr-codes-page.component';
import { CartesPageComponent } from './pages/cartes-page/cartes-page.component';
import { UtilisateursPageComponent } from './pages/utilisateurs-page/utilisateurs-page.component';
import { RolesPageComponent } from './pages/roles-page/roles-page.component';
import { AuditLogsPageComponent } from './pages/audit-logs-page/audit-logs-page.component';
import { ConfigurationPageComponent } from './pages/configuration-page/configuration-page.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    QrCodesPageComponent,
    EnseignantQrCodesPageComponent,
    CartesPageComponent,
    UtilisateursPageComponent,
    RolesPageComponent,
    AuditLogsPageComponent,
    ConfigurationPageComponent,
  ],
  imports: [
    CommonModule,
    AdministrationRoutingModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class AdministrationModule { }
