import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StagesRoutingModule } from './stages-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListeOffresPageComponent } from './pages/liste-offres-page/liste-offres-page.component';
import { NouvelleOffrePageComponent } from './pages/nouvelle-offre-page/nouvelle-offre-page.component';
import { DetailsOffrePageComponent } from './pages/details-offre-page/details-offre-page.component';
import { ListeDemandesPageComponent } from './pages/liste-demandes-page/liste-demandes-page.component';
import { DetailsDemandePageComponent } from './pages/details-demande-page/details-demande-page.component';
import { ListeEntreprisesPageComponent } from './pages/liste-entreprises-page/liste-entreprises-page.component';
import { NouvelleEntreprisePageComponent } from './pages/nouvelle-entreprise-page/nouvelle-entreprise-page.component';
import { DetailsEntreprisePageComponent } from './pages/details-entreprise-page/details-entreprise-page.component';

@NgModule({
    declarations: [
        ListeOffresPageComponent,
        NouvelleOffrePageComponent,
        DetailsOffrePageComponent,
        ListeDemandesPageComponent,
        DetailsDemandePageComponent,
        ListeEntreprisesPageComponent,
        NouvelleEntreprisePageComponent,
        DetailsEntreprisePageComponent,
    ],
    imports: [CommonModule, StagesRoutingModule, SharedModule]
})
export class StagesModule { }
