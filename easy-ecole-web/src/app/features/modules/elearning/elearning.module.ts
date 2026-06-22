import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ElearningRoutingModule } from './elearning-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { MesCoursPageComponent } from './pages/mes-cours-page/mes-cours-page.component';
import { CoursDetailsPageComponent } from './pages/cours-details-page/cours-details-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import { UploadSupportPageComponent } from './pages/upload-support-page/upload-support-page.component';
import { GestionElearningPageComponent } from './pages/gestion-elearning-page/gestion-elearning-page.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { SupportCardComponent } from './components/support-card/support-card.component';

@NgModule({
  declarations: [
    MesCoursPageComponent,
    CoursDetailsPageComponent,
    ChatPageComponent,
    UploadSupportPageComponent,
    GestionElearningPageComponent,
    ChatWindowComponent,
    SupportCardComponent
  ],
  imports: [
    CommonModule,
    ElearningRoutingModule,
    SharedModule
  ]
})
export class ElearningModule { }
