import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QrCodesPageComponent } from './pages/qr-codes-page/qr-codes-page.component';
import { EnseignantQrCodesPageComponent } from './pages/enseignant-qr-codes-page/enseignant-qr-codes-page.component';
import { CartesPageComponent } from './pages/cartes-page/cartes-page.component';

const routes: Routes = [
  { path: 'qr-codes', component: QrCodesPageComponent, pathMatch: 'full' },
  { path: 'qr-codes-enseignants', component: EnseignantQrCodesPageComponent, pathMatch: 'full' },
  { path: 'cartes', component: CartesPageComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule { }
