import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PointageRoutingModule } from './pointage-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { TerminalPointagePageComponent } from './pages/terminal-pointage-page/terminal-pointage-page.component';
import { HistoriquePointagePageComponent } from './pages/historique-pointage-page/historique-pointage-page.component';
import { ListeShiftsPageComponent } from './pages/liste-shifts-page/liste-shifts-page.component';
import { ShiftFormPageComponent } from './pages/shift-form-page/shift-form-page.component';
import { AbsencesPageComponent } from './pages/absences-page/absences-page.component';
import { PlanningPageComponent } from './pages/planning-page/planning-page.component';
import { RapportsPointagePageComponent } from './pages/rapports-pointage-page/rapports-pointage-page.component';

@NgModule({
  declarations: [
    TerminalPointagePageComponent,
    HistoriquePointagePageComponent,
    ListeShiftsPageComponent,
    ShiftFormPageComponent,
    AbsencesPageComponent,
    PlanningPageComponent,
    RapportsPointagePageComponent
  ],
  imports: [
    CommonModule,
    PointageRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class PointageModule { }
