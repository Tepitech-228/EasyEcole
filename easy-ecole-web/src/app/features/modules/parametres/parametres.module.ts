import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParametresRoutingModule } from './parametres-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { MonComptePageComponent } from './pages/mon-compte-page/mon-compte-page.component';
import { MonProfilPageComponent } from './pages/mon-profil-page/mon-profil-page.component';
import { ParametresSectionComponent } from './components/parametres-section/parametres-section.component';
import { EcolePageComponent } from './pages/ecole-page/ecole-page.component';
import { AnneesScolairesPageComponent } from './pages/annees-scolaires-page/annees-scolaires-page.component';
import { AnneeScolaireFormPageComponent } from './pages/annee-scolaire-form-page/annee-scolaire-form-page.component';
import { BaremesPageComponent } from './pages/baremes-page/baremes-page.component';
import { BaremeFormPageComponent } from './pages/bareme-form-page/bareme-form-page.component';
import { FraisPageComponent } from './pages/frais-page/frais-page.component';
import { FraisFormPageComponent } from './pages/frais-form-page/frais-form-page.component';
import { NotificationsPageComponent } from './pages/notifications-page/notifications-page.component';
import { RolesPageComponent } from './pages/roles-page/roles-page.component';
import { SystemePageComponent } from './pages/systeme-page/systeme-page.component';
import { AuditPageComponent } from './pages/audit-page/audit-page.component';
import { SauvegardesPageComponent } from './pages/sauvegardes-page/sauvegardes-page.component';
import { ModelesPageComponent } from './pages/modeles-page/modeles-page.component';
import { ModeleEditPageComponent } from './pages/modele-edit-page/modele-edit-page.component';
import { GestionPermissionsPageComponent } from './pages/gestion-permissions-page/gestion-permissions-page.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    MonComptePageComponent,
    MonProfilPageComponent,
    ParametresSectionComponent,
    EcolePageComponent,
    AnneesScolairesPageComponent,
    AnneeScolaireFormPageComponent,
    BaremesPageComponent,
    BaremeFormPageComponent,
    FraisPageComponent,
    FraisFormPageComponent,
    NotificationsPageComponent,
    RolesPageComponent,
    SystemePageComponent,
    AuditPageComponent,
    SauvegardesPageComponent,
    ModelesPageComponent,
    ModeleEditPageComponent,
    GestionPermissionsPageComponent,
  ],
  imports: [
    CommonModule,
    ParametresRoutingModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class ParametresModule { }
