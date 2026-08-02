import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MesCoursPageComponent } from './pages/mes-cours-page/mes-cours-page.component';
import { CoursVideosPageComponent } from './pages/cours-videos-page/cours-videos-page.component';
import { CoursPdfsPageComponent } from './pages/cours-pdfs-page/cours-pdfs-page.component';
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
import { CatalogueElearningPageComponent } from './pages/catalogue-elearning-page/catalogue-elearning-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: MesCoursPageComponent },
  { path: 'videos', component: CoursVideosPageComponent },
  { path: 'pdfs', component: CoursPdfsPageComponent },
  { path: 'quiz/nouveau', component: QuizFormPageComponent },
  { path: 'quiz/:id', component: QuizDoPageComponent },
  { path: 'quiz', component: QuizPageComponent },
  { path: 'progression', component: ProgressionPageComponent },
  { path: 'certificats', component: CertificatsPageComponent },
  { path: 'devoirs/:id', component: DevoirDetailPageComponent },
  { path: 'devoirs', component: DevoirsPageComponent },
  { path: 'admin/gestion', component: GestionElearningPageComponent },
  { path: 'catalogue', component: CatalogueElearningPageComponent },
  { path: ':id/player', component: CoursPlayerPageComponent },
  { path: ':id/chat', component: ChatPageComponent },
  { path: ':id/upload', component: UploadSupportPageComponent },
  { path: ':id', component: CoursDetailsPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ElearningRoutingModule { }

