import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QrCodesPageComponent } from './pages/qr-codes-page/qr-codes-page.component';
import { EnseignantQrCodesPageComponent } from './pages/enseignant-qr-codes-page/enseignant-qr-codes-page.component';
import { CartesPageComponent } from './pages/cartes-page/cartes-page.component';
import { UtilisateursPageComponent } from './pages/utilisateurs-page/utilisateurs-page.component';
import { RolesPageComponent } from './pages/roles-page/roles-page.component';
import { AuditLogsPageComponent } from './pages/audit-logs-page/audit-logs-page.component';
import { ConfigurationPageComponent } from './pages/configuration-page/configuration-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'utilisateurs', pathMatch: 'full' },
  { path: 'qr-codes', component: QrCodesPageComponent },
  { path: 'qr-codes-enseignants', component: EnseignantQrCodesPageComponent },
  { path: 'cartes', component: CartesPageComponent },
  { path: 'utilisateurs', component: UtilisateursPageComponent },
  { path: 'roles', component: RolesPageComponent },
  { path: 'audit-logs', component: AuditLogsPageComponent },
  { path: 'configuration', component: ConfigurationPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule { }
