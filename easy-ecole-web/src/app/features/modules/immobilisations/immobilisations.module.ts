import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ImmobilisationsRoutingModule } from './immobilisations-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListeImmobilisationsPageComponent } from './pages/liste-immobilisations-page/liste-immobilisations-page.component';
import { NouvelleImmobilisationPageComponent } from './pages/nouvelle-immobilisation-page/nouvelle-immobilisation-page.component';
import { DetailsImmobilisationPageComponent } from './pages/details-immobilisation-page/details-immobilisation-page.component';
import { ListeSitesPageComponent } from './pages/liste-sites-page/liste-sites-page.component';
import { NouveauSitePageComponent } from './pages/nouveau-site-page/nouveau-site-page.component';
import { ListeCategoriesPageComponent } from './pages/liste-categories-page/liste-categories-page.component';
import { ListeMaintenancesPageComponent } from './pages/liste-maintenances-page/liste-maintenances-page.component';
import { NouvelleMaintenancePageComponent } from './pages/nouvelle-maintenance-page/nouvelle-maintenance-page.component';
import { NouvelleCategoriePageComponent } from './pages/nouvelle-categorie-page/nouvelle-categorie-page.component';

@NgModule({
    declarations: [
        ListeImmobilisationsPageComponent, NouvelleImmobilisationPageComponent, DetailsImmobilisationPageComponent,
        ListeSitesPageComponent, NouveauSitePageComponent,
        ListeCategoriesPageComponent, ListeMaintenancesPageComponent,
        NouvelleMaintenancePageComponent, NouvelleCategoriePageComponent,
    ],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ImmobilisationsRoutingModule, SharedModule]
})
export class ImmobilisationsModule { }
