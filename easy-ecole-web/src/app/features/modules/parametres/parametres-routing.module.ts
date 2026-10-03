import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MonComptePageComponent } from './pages/mon-compte-page/mon-compte-page.component';
import { MonProfilPageComponent } from './pages/mon-profil-page/mon-profil-page.component';
import { EcolePageComponent } from './pages/ecole-page/ecole-page.component';
import { AnneesScolairesPageComponent } from './pages/annees-scolaires-page/annees-scolaires-page.component';
import { AnneeScolaireFormPageComponent } from './pages/annee-scolaire-form-page/annee-scolaire-form-page.component';
import { BaremesPageComponent } from './pages/baremes-page/baremes-page.component';
import { BaremeFormPageComponent } from './pages/bareme-form-page/bareme-form-page.component';
import { FraisPageComponent } from './pages/frais-page/frais-page.component';
import { FraisFormPageComponent } from './pages/frais-form-page/frais-form-page.component';
import { NotificationsPageComponent } from './pages/notifications-page/notifications-page.component';
import { SystemePageComponent } from './pages/systeme-page/systeme-page.component';
import { AuditPageComponent } from './pages/audit-page/audit-page.component';
import { SauvegardesPageComponent } from './pages/sauvegardes-page/sauvegardes-page.component';
import { ModelesPageComponent } from './pages/modeles-page/modeles-page.component';
import { ModeleEditPageComponent } from './pages/modele-edit-page/modele-edit-page.component';
import { GestionPermissionsPageComponent } from './pages/gestion-permissions-page/gestion-permissions-page.component';
import { PermissionGuard } from 'src/app/core/guards/permission.guard';

const routes: Routes = [
  { path: 'profil', component: MonProfilPageComponent },
  { path: 'compte', component: MonComptePageComponent },
  { path: 'ecole', component: EcolePageComponent },
  { path: 'annees-scolaires', component: AnneesScolairesPageComponent },
  { path: 'annees-scolaires/nouveau', component: AnneeScolaireFormPageComponent },
  { path: 'annees-scolaires/:id', component: AnneeScolaireFormPageComponent },
  { path: 'baremes', component: BaremesPageComponent },
  { path: 'baremes/nouveau', component: BaremeFormPageComponent },
  { path: 'baremes/:id', component: BaremeFormPageComponent },
  { path: 'frais', component: FraisPageComponent },
  { path: 'frais/nouveau', component: FraisFormPageComponent },
  { path: 'frais/:id', component: FraisFormPageComponent },
  { path: 'notifications', component: NotificationsPageComponent },
  { path: 'roles', redirectTo: '/administration/roles', pathMatch: 'full' },
  { path: 'roles/:id', redirectTo: '/administration/roles', pathMatch: 'full' },
  { path: 'systeme', component: SystemePageComponent },
  { path: 'audit', component: AuditPageComponent },
  { path: 'sauvegardes', component: SauvegardesPageComponent },
  { path: 'modeles', component: ModelesPageComponent },
  { path: 'modeles/:id', component: ModeleEditPageComponent },
  { path: 'permissions', component: GestionPermissionsPageComponent, canActivate: [PermissionGuard], data: { permission: 'menu.administration.permissions' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParametresRoutingModule { }
