import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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

const routes: Routes = [
  { path: '', component: ListeBulletinsPageComponent },
  { path: 'mon-releve', component: MonRelevePageComponent },
  { path: 'generer', component: GenererBulletinsPageComponent },
  { path: 'echelles', component: EchellesPageComponent },
  { path: 'echelles/nouveau', component: EchelleFormPageComponent },
  { path: 'echelles/:id', component: EchelleFormPageComponent },
  { path: 'deliberations', component: DeliberationsPageComponent },
  { path: 'deliberations/:id', component: DeliberationDetailPageComponent },
  { path: 'parametres', component: ParametresBulletinsPageComponent },
  { path: 'moyennes', component: MoyennesPageComponent },
  { path: 'ues', component: UesPageComponent },
  { path: 'ues/nouveau', component: UeFormPageComponent },
  { path: 'ues/:id', component: UeFormPageComponent },
  { path: 'mcc', component: MccPageComponent },
  { path: 'mcc/nouveau', component: MccFormPageComponent },
  { path: 'mcc/:id', component: MccFormPageComponent },
  { path: 'sessions', component: SessionsExamenPageComponent },
  { path: 'sessions/nouveau', component: SessionExamenFormPageComponent },
  { path: 'sessions/:id', component: SessionExamenFormPageComponent },
  { path: 'absences', component: AbsencesEvaluationPageComponent },
  { path: 'absences/nouveau', component: AbsenceEvaluationFormPageComponent },
  { path: 'absences/:id', component: AbsenceEvaluationFormPageComponent },
  { path: 'equivalences', component: EquivalencesPageComponent },
  { path: 'equivalences/nouveau', component: EquivalenceFormPageComponent },
  { path: 'equivalences/:id', component: EquivalenceFormPageComponent },
  { path: 'dispenses', component: DispensesPageComponent },
  { path: 'dispenses/nouveau', component: DispenseFormPageComponent },
  { path: 'dispenses/:id', component: DispenseFormPageComponent },
  { path: 'audit-notes', component: AuditNotesPageComponent },
  { path: 'jury', component: JuryMembresPageComponent },
  { path: 'jury/nouveau', component: JuryMembreFormPageComponent },
  { path: 'jury/:id', component: JuryMembreFormPageComponent },
  { path: ':id', component: DetailBulletinPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BulletinsRoutingModule {}
