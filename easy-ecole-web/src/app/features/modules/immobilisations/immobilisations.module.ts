import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImmobilisationsRoutingModule } from './immobilisations-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListeImmobilisationsPageComponent } from './pages/liste-immobilisations-page/liste-immobilisations-page.component';
import { NouvelleImmobilisationPageComponent } from './pages/nouvelle-immobilisation-page/nouvelle-immobilisation-page.component';
import { DetailsImmobilisationPageComponent } from './pages/details-immobilisation-page/details-immobilisation-page.component';
import { ListeSitesPageComponent } from './pages/liste-sites-page/liste-sites-page.component';
import { NouveauSitePageComponent } from './pages/nouveau-site-page/nouveau-site-page.component';
import { ListeCategoriesPageComponent } from './pages/liste-categories-page/liste-categories-page.component';
import { ListeMaintenancesPageComponent } from './pages/liste-maintenances-page/liste-maintenances-page.component';

@NgModule({
    declarations: [
        ListeImmobilisationsPageComponent, NouvelleImmobilisationPageComponent, DetailsImmobilisationPageComponent,
        ListeSitesPageComponent, NouveauSitePageComponent,
        ListeCategoriesPageComponent, ListeMaintenancesPageComponent,
    ],
    imports: [CommonModule, ImmobilisationsRoutingModule, SharedModule]
})
export class ImmobilisationsModule { }
