import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { ListeImmobilisationsPageComponent } from './pages/liste-immobilisations-page/liste-immobilisations-page.component';
import { NouvelleImmobilisationPageComponent } from './pages/nouvelle-immobilisation-page/nouvelle-immobilisation-page.component';
import { DetailsImmobilisationPageComponent } from './pages/details-immobilisation-page/details-immobilisation-page.component';
import { ListeSitesPageComponent } from './pages/liste-sites-page/liste-sites-page.component';
import { NouveauSitePageComponent } from './pages/nouveau-site-page/nouveau-site-page.component';
import { ListeCategoriesPageComponent } from './pages/liste-categories-page/liste-categories-page.component';
import { ListeMaintenancesPageComponent } from './pages/liste-maintenances-page/liste-maintenances-page.component';
import { NouvelleMaintenancePageComponent } from './pages/nouvelle-maintenance-page/nouvelle-maintenance-page.component';
import { NouvelleCategoriePageComponent } from './pages/nouvelle-categorie-page/nouvelle-categorie-page.component';

const routes: Routes = [
    {
        path: '',
        children: [
            { path: '', component: ListeImmobilisationsPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouvelleImmobilisationPageComponent, pathMatch: 'full' }]
            },
        ]
    },
    {
        path: 'sites',
        children: [
            { path: '', component: ListeSitesPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouveauSitePageComponent, pathMatch: 'full' }]
            },
        ]
    },
    {
        path: 'categories',
        children: [
            { path: '', component: ListeCategoriesPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouvelleCategoriePageComponent, pathMatch: 'full' }]
            },
        ]
    },
    {
        path: 'maintenances',
        children: [
            { path: '', component: ListeMaintenancesPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouvelleMaintenancePageComponent, pathMatch: 'full' }]
            },
        ]
    },
    { path: ':id', component: DetailsImmobilisationPageComponent, pathMatch: 'full' },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ImmobilisationsRoutingModule { }
