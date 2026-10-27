import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdministrationRoutingModule } from './administration-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardAdminPageComponent } from './pages/dashboard-admin-page/dashboard-admin-page.component';
import { QrCodesPageComponent } from './pages/qr-codes-page/qr-codes-page.component';
import { EnseignantQrCodesPageComponent } from './pages/enseignant-qr-codes-page/enseignant-qr-codes-page.component';
import { PersonnelQrCodesPageComponent } from './pages/personnel-qr-codes-page/personnel-qr-codes-page.component';
import { UtilisateursPageComponent } from './pages/utilisateurs-page/utilisateurs-page.component';
import { RolesPageComponent } from './pages/roles-page/roles-page.component';
import { PolesMenusPageComponent } from './pages/poles-menus-page/poles-menus-page.component';
import { AuditLogsPageComponent } from './pages/audit-logs-page/audit-logs-page.component';
import { ConfigurationPageComponent } from './pages/configuration-page/configuration-page.component';
import { ComiteMembresPageComponent } from './pages/comite-membres-page/comite-membres-page.component';
import { SitesPageComponent } from './pages/sites-page/sites-page.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DashboardAdminPageComponent,
    QrCodesPageComponent,
    EnseignantQrCodesPageComponent,
    PersonnelQrCodesPageComponent,
    UtilisateursPageComponent,
    RolesPageComponent,
    PolesMenusPageComponent,
    AuditLogsPageComponent,
    ConfigurationPageComponent,
    ComiteMembresPageComponent,
    SitesPageComponent,
  ],
  imports: [
    CommonModule,
    AdministrationRoutingModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class AdministrationModule { }
