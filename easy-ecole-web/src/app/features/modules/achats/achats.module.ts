import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchatsRoutingModule } from './achats-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
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

@NgModule({
  declarations: [
    ListeDemandesPageComponent,
    NouvelleDemandePageComponent,
    DetailsDemandePageComponent,
    ValidationsPageComponent,
    ListeCommandesPageComponent,
    CommandeDetailsPageComponent,
    ReceptionsPageComponent,
    FacturesPageComponent,
    BudgetsPageComponent,
    FournisseursPageComponent,
    ParametresValidateursPageComponent,
  ],
  imports: [CommonModule, AchatsRoutingModule, SharedModule]
})
export class AchatsModule { }
