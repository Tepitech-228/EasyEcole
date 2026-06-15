import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PointageRoutingModule } from './pointage-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { TerminalPointagePageComponent } from './pages/terminal-pointage-page/terminal-pointage-page.component';
import { HistoriquePointagePageComponent } from './pages/historique-pointage-page/historique-pointage-page.component';

@NgModule({
  declarations: [
    TerminalPointagePageComponent,
    HistoriquePointagePageComponent
  ],
  imports: [
    CommonModule,
    PointageRoutingModule,
    SharedModule
  ]
})
export class PointageModule { }
