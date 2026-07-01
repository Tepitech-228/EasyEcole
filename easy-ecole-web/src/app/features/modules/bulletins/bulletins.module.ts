import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BulletinsRoutingModule } from './bulletins-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListeBulletinsPageComponent } from './pages/liste-bulletins-page/liste-bulletins-page.component';
import { GenererBulletinsPageComponent } from './pages/generer-bulletins-page/generer-bulletins-page.component';
import { DetailBulletinPageComponent } from './pages/detail-bulletin-page/detail-bulletin-page.component';
import { MonRelevePageComponent } from './pages/mon-releve-page/mon-releve-page.component';
import { EchellesPageComponent } from './pages/echelles-page/echelles-page.component';
import { EchelleFormPageComponent } from './pages/echelle-form-page/echelle-form-page.component';
import { DeliberationsPageComponent } from './pages/deliberations-page/deliberations-page.component';
import { DeliberationDetailPageComponent } from './pages/deliberation-detail-page/deliberation-detail-page.component';
import { ParametresBulletinsPageComponent } from './pages/parametres-bulletins-page/parametres-bulletins-page.component';
import { MoyennesPageComponent } from './pages/moyennes-page/moyennes-page.component';
import { SignaturePadComponent } from './components/signature-pad/signature-pad.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    SignaturePadComponent,
    ListeBulletinsPageComponent,
    GenererBulletinsPageComponent,
    DetailBulletinPageComponent,
    MonRelevePageComponent,
    EchellesPageComponent,
    EchelleFormPageComponent,
    DeliberationsPageComponent,
    DeliberationDetailPageComponent,
    ParametresBulletinsPageComponent,
    MoyennesPageComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BulletinsRoutingModule,
    SharedModule,
  ]
})
export class BulletinsModule {}
