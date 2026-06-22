import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MesCoursPageComponent } from './pages/mes-cours-page/mes-cours-page.component';
import { CoursDetailsPageComponent } from './pages/cours-details-page/cours-details-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import { UploadSupportPageComponent } from './pages/upload-support-page/upload-support-page.component';
import { GestionElearningPageComponent } from './pages/gestion-elearning-page/gestion-elearning-page.component';

const routes: Routes = [
  {
    path: '',
    component: MesCoursPageComponent,
    pathMatch: 'full'
  },
  {
    path: ':id',
    component: CoursDetailsPageComponent,
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
    path: 'admin/gestion',
    component: GestionElearningPageComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ElearningRoutingModule { }
