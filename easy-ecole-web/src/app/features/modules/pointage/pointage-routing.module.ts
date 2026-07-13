import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TerminalPointagePageComponent } from './pages/terminal-pointage-page/terminal-pointage-page.component';
import { HistoriquePointagePageComponent } from './pages/historique-pointage-page/historique-pointage-page.component';
import { ListeShiftsPageComponent } from './pages/liste-shifts-page/liste-shifts-page.component';
import { ShiftFormPageComponent } from './pages/shift-form-page/shift-form-page.component';
import { AbsencesPageComponent } from './pages/absences-page/absences-page.component';
import { PlanningPageComponent } from './pages/planning-page/planning-page.component';
import { RapportsPointagePageComponent } from './pages/rapports-pointage-page/rapports-pointage-page.component';

const routes: Routes = [
  { path: '', component: TerminalPointagePageComponent, pathMatch: 'full' },
  { path: 'historique', component: HistoriquePointagePageComponent, pathMatch: 'full' },
  { path: 'shifts', component: ListeShiftsPageComponent, pathMatch: 'full' },
  { path: 'shifts/nouveau', component: ShiftFormPageComponent, pathMatch: 'full' },
  { path: 'shifts/:id', component: ShiftFormPageComponent, pathMatch: 'full' },
  { path: 'absences', component: AbsencesPageComponent, pathMatch: 'full' },
  { path: 'planning', component: PlanningPageComponent, pathMatch: 'full' },
  { path: 'rapports', component: RapportsPointagePageComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PointageRoutingModule { }
