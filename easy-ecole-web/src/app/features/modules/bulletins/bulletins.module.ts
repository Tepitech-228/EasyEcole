import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BulletinsRoutingModule } from './bulletins-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListeBulletinsPageComponent } from './pages/liste-bulletins-page/liste-bulletins-page.component';
import { GenererBulletinsPageComponent } from './pages/generer-bulletins-page/generer-bulletins-page.component';
import { DetailBulletinPageComponent } from './pages/detail-bulletin-page/detail-bulletin-page.component';
import { MonRelevePageComponent } from './pages/mon-releve-page/mon-releve-page.component';
import { EchelleFormPageComponent } from './pages/echelle-form-page/echelle-form-page.component';
import { ParametresNotationPageComponent } from './pages/parametres-notation-page/parametres-notation-page.component';
import { DeliberationsJuryPageComponent } from './pages/deliberations-jury-page/deliberations-jury-page.component';
import { DeliberationDetailPageComponent } from './pages/deliberation-detail-page/deliberation-detail-page.component';
import { ParametresBulletinsPageComponent } from './pages/parametres-bulletins-page/parametres-bulletins-page.component';
import { MoyennesPageComponent } from './pages/moyennes-page/moyennes-page.component';
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
import { JuryMembreFormPageComponent } from './pages/jury-membre-form-page/jury-membre-form-page.component';
import { ListeRattrapagesPageComponent } from './pages/liste-rattrapages-page/liste-rattrapages-page.component';
import { RattrapageFormPageComponent } from './pages/rattrapage-form-page/rattrapage-form-page.component';
import { DetailRattrapagePageComponent } from './pages/detail-rattrapage-page/detail-rattrapage-page.component';
import { SignaturePadComponent } from './components/signature-pad/signature-pad.component';
import { FeuillePresencePageComponent } from './pages/feuille-presence-page/feuille-presence-page.component';
import { AbsencesCoursPageComponent } from './pages/absences-cours-page/absences-cours-page.component';
import { DettesAcademiquesPageComponent } from './pages/dettes-academiques-page/dettes-academiques-page.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    SignaturePadComponent,
    ListeBulletinsPageComponent,
    GenererBulletinsPageComponent,
    DetailBulletinPageComponent,
    MonRelevePageComponent,
    ParametresNotationPageComponent,
    EchelleFormPageComponent,
    DeliberationsJuryPageComponent,
    DeliberationDetailPageComponent,
    ParametresBulletinsPageComponent,
    MoyennesPageComponent,
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
    JuryMembreFormPageComponent,
    ListeRattrapagesPageComponent,
    RattrapageFormPageComponent,
    DetailRattrapagePageComponent,
    FeuillePresencePageComponent,
    AbsencesCoursPageComponent,
    DettesAcademiquesPageComponent,
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
