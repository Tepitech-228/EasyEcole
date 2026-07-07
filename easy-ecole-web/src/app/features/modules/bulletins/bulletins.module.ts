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
import { UesPageComponent } from './pages/ues-page/ues-page.component';
import { UeFormPageComponent } from './pages/ue-form-page/ue-form-page.component';
import { MccPageComponent } from './pages/mcc-page/mcc-page.component';
import { MccFormPageComponent } from './pages/mcc-form-page/mcc-form-page.component';
import { SessionsExamenPageComponent } from './pages/sessions-examen-page/sessions-examen-page.component';
import { SessionExamenFormPageComponent } from './pages/session-examen-form-page/session-examen-form-page.component';
import { AbsencesEvaluationPageComponent } from './pages/absences-evaluation-page/absences-evaluation-page.component';
import { AbsenceEvaluationFormPageComponent } from './pages/absence-evaluation-form-page/absence-evaluation-form-page.component';
import { EquivalencesPageComponent } from './pages/equivalences-page/equivalences-page.component';
import { EquivalenceFormPageComponent } from './pages/equivalence-form-page/equivalence-form-page.component';
import { DispensesPageComponent } from './pages/dispenses-page/dispenses-page.component';
import { DispenseFormPageComponent } from './pages/dispense-form-page/dispense-form-page.component';
import { AuditNotesPageComponent } from './pages/audit-notes-page/audit-notes-page.component';
import { JuryMembresPageComponent } from './pages/jury-membres-page/jury-membres-page.component';
import { JuryMembreFormPageComponent } from './pages/jury-membre-form-page/jury-membre-form-page.component';
import { ListeRattrapagesPageComponent } from './pages/liste-rattrapages-page/liste-rattrapages-page.component';
import { RattrapageFormPageComponent } from './pages/rattrapage-form-page/rattrapage-form-page.component';
import { DetailRattrapagePageComponent } from './pages/detail-rattrapage-page/detail-rattrapage-page.component';
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
    UesPageComponent,
    UeFormPageComponent,
    MccPageComponent,
    MccFormPageComponent,
    SessionsExamenPageComponent,
    SessionExamenFormPageComponent,
    AbsencesEvaluationPageComponent,
    AbsenceEvaluationFormPageComponent,
    EquivalencesPageComponent,
    EquivalenceFormPageComponent,
    DispensesPageComponent,
    DispenseFormPageComponent,
    AuditNotesPageComponent,
    JuryMembresPageComponent,
    JuryMembreFormPageComponent,
    ListeRattrapagesPageComponent,
    RattrapageFormPageComponent,
    DetailRattrapagePageComponent,
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
