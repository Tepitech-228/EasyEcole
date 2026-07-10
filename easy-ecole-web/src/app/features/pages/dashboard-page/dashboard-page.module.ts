import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';

import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardWidgetComponent } from './widgets/dashboard-widget/dashboard-widget.component';
import { WidgetAgendaComponent } from './widgets/widget-agenda/widget-agenda.component';
import { WidgetNotesRecentesComponent } from './widgets/widget-notes-recentes/widget-notes-recentes.component';
import { WidgetNotesASaisirComponent } from './widgets/widget-notes-a-saisir/widget-notes-a-saisir.component';
import { WidgetDocumentsComponent } from './widgets/widget-documents/widget-documents.component';
import { WidgetProchainCoursComponent } from './widgets/widget-prochain-cours/widget-prochain-cours.component';
import { WidgetPlanningPersonnelComponent } from './widgets/widget-planning-personnel/widget-planning-personnel.component';

@NgModule({
  declarations: [
    DashboardPageComponent,
    DashboardWidgetComponent,
    WidgetAgendaComponent,
    WidgetNotesRecentesComponent,
    WidgetNotesASaisirComponent,
    WidgetDocumentsComponent,
    WidgetProchainCoursComponent,
    WidgetPlanningPersonnelComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    SharedModule,
  ],
  exports: [
    DashboardPageComponent,
  ]
})
export class DashboardPageModule { }
