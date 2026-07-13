import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { ListeDemandesPageComponent } from './pages/liste-demandes-page/liste-demandes-page.component';
import { NouvelleDemandePageComponent } from './pages/nouvelle-demande-page/nouvelle-demande-page.component';
import { DetailsDemandePageComponent } from './pages/details-demande-page/details-demande-page.component';
import { ValidationsPageComponent } from './pages/validations-page/validations-page.component';
import { ListeCommandesPageComponent } from './pages/liste-commandes-page/liste-commandes-page.component';
import { CommandeDetailsPageComponent } from './pages/commande-details-page/commande-details-page.component';
import { ReceptionsPageComponent } from './pages/receptions-page/receptions-page.component';
import { FacturesPageComponent } from './pages/factures-page/factures-page.component';
import { BudgetsPageComponent } from './pages/budgets-page/budgets-page.component';
import { FournisseursPageComponent } from './pages/fournisseurs-page/fournisseurs-page.component';
import { ParametresValidateursPageComponent } from './pages/parametres-validateurs-page/parametres-validateurs-page.component';

const routes: Routes = [
  {
    path: 'demandes',
    children: [
      { path: '', component: ListeDemandesPageComponent, pathMatch: 'full' },
      {
        path: 'nouveau',
        canActivateChild: [AuthGuard],
        children: [{ path: '', component: NouvelleDemandePageComponent, pathMatch: 'full' }]
      },
      { path: ':id', component: DetailsDemandePageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'validations',
    children: [
      { path: '', component: ValidationsPageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'commandes',
    children: [
      { path: '', component: ListeCommandesPageComponent, pathMatch: 'full' },
      { path: ':id', component: CommandeDetailsPageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'receptions',
    children: [
      { path: '', component: ReceptionsPageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'factures',
    children: [
      { path: '', component: FacturesPageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'budgets',
    children: [
      { path: '', component: BudgetsPageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'fournisseurs',
    children: [
      { path: '', component: FournisseursPageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'parametres-validateurs',
    children: [
      { path: '', component: ParametresValidateursPageComponent, pathMatch: 'full' },
    ]
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AchatsRoutingModule { }
