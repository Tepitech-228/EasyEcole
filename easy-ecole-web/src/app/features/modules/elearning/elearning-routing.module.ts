import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MesCoursPageComponent } from './pages/mes-cours-page/mes-cours-page.component';
import { CoursDetailsPageComponent } from './pages/cours-details-page/cours-details-page.component';
import { CoursPlayerPageComponent } from './pages/cours-player-page/cours-player-page.component';
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

const routes: Routes = [
  {
    path: '',
    component: MesCoursPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'quiz/nouveau',
    component: QuizFormPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'quiz/:id',
    component: QuizDoPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'quiz',
    component: QuizPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'progression',
    component: ProgressionPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'certificats',
    component: CertificatsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'devoirs/:id',
    component: DevoirDetailPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'devoirs',
    component: DevoirsPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'admin/gestion',
    component: GestionElearningPageComponent,
    pathMatch: 'full'
  },
  {
    path: ':id/player',
    component: CoursPlayerPageComponent,
    pathMatch: 'full'
  },
  {
    path: ':id/chat',
    component: ChatPageComponent,
    pathMatch: 'full'
  },
  {
    path: ':id/upload',
    component: UploadSupportPageComponent,
    pathMatch: 'full'
  },
  {
    path: ':id',
    component: CoursDetailsPageComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ElearningRoutingModule { }

