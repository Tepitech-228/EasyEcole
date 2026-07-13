import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ElearningRoutingModule } from './elearning-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { MesCoursPageComponent } from './pages/mes-cours-page/mes-cours-page.component';
import { CoursDetailsPageComponent } from './pages/cours-details-page/cours-details-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import { UploadSupportPageComponent } from './pages/upload-support-page/upload-support-page.component';
import { GestionElearningPageComponent } from './pages/gestion-elearning-page/gestion-elearning-page.component';
import { QuizPageComponent } from './pages/quiz-page/quiz-page.component';
import { QuizFormPageComponent } from './pages/quiz-form-page/quiz-form-page.component';
import { QuizDoPageComponent } from './pages/quiz-do-page/quiz-do-page.component';
import { ProgressionPageComponent } from './pages/progression-page/progression-page.component';
import { CertificatsPageComponent } from './pages/certificats-page/certificats-page.component';
import { DevoirsPageComponent } from './pages/devoirs-page/devoirs-page.component';
import { DevoirDetailPageComponent } from './pages/devoir-detail-page/devoir-detail-page.component';
import { CoursPlayerPageComponent } from './pages/cours-player-page/cours-player-page.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { SupportCardComponent } from './components/support-card/support-card.component';

@NgModule({
  declarations: [
    MesCoursPageComponent,
    CoursDetailsPageComponent,
    ChatPageComponent,
    UploadSupportPageComponent,
    GestionElearningPageComponent,
    QuizPageComponent,
    QuizFormPageComponent,
    QuizDoPageComponent,
    ProgressionPageComponent,
    CertificatsPageComponent,
    DevoirsPageComponent,
    DevoirDetailPageComponent,
    CoursPlayerPageComponent,
    ChatWindowComponent,
    SupportCardComponent
  ],
  imports: [
    CommonModule,
    ElearningRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ElearningModule { }

