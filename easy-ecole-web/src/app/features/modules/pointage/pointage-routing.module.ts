import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TerminalPointagePageComponent } from './pages/terminal-pointage-page/terminal-pointage-page.component';
import { HistoriquePointagePageComponent } from './pages/historique-pointage-page/historique-pointage-page.component';

const routes: Routes = [
  { path: '', component: TerminalPointagePageComponent, pathMatch: 'full' },
  { path: 'historique', component: HistoriquePointagePageComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PointageRoutingModule { }
