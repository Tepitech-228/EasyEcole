import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParentDashboardComponent } from './pages/parent-dashboard/parent-dashboard.component';
import { ParentNotesComponent } from './pages/parent-notes/parent-notes.component';
import { ParentAbsencesComponent } from './pages/parent-absences/parent-absences.component';
import { ParentEdtComponent } from './pages/parent-edt/parent-edt.component';
import { ParentPaiementsComponent } from './pages/parent-paiements/parent-paiements.component';
import { ParentDocumentsComponent } from './pages/parent-documents/parent-documents.component';
import { ParentGuard } from '../../../core/guards/parent.guard';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [ParentGuard],
    children: [
      { path: '', component: ParentDashboardComponent, pathMatch: 'full' },
      { path: 'notes/:apprenantId', component: ParentNotesComponent },
      { path: 'notes', component: ParentNotesComponent },
      { path: 'absences/:apprenantId', component: ParentAbsencesComponent },
      { path: 'absences', component: ParentAbsencesComponent },
      { path: 'emploi-du-temps/:apprenantId', component: ParentEdtComponent },
      { path: 'emploi-du-temps', component: ParentEdtComponent },
      { path: 'paiements/:apprenantId', component: ParentPaiementsComponent },
      { path: 'paiements', component: ParentPaiementsComponent },
      { path: 'documents/:apprenantId', component: ParentDocumentsComponent },
      { path: 'documents', component: ParentDocumentsComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParentRoutingModule { }
