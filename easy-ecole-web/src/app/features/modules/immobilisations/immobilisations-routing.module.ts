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
import { ListeAssurancesPageComponent } from './pages/liste-assurances-page/liste-assurances-page.component';
import { ListeAffectationsPageComponent } from './pages/liste-affectations-page/liste-affectations-page.component';
import { ListeSortiesProvisoiresPageComponent } from './pages/liste-sorties-provisoires-page/liste-sorties-provisoires-page.component';
import { ListeInventairesImmoPageComponent } from './pages/liste-inventaires-immo-page/liste-inventaires-immo-page.component';
import { ReportingImmoPageComponent } from './pages/reporting-immo-page/reporting-immo-page.component';
import { ListeCessionsPageComponent } from './pages/liste-cessions-page/liste-cessions-page.component';
import { ListeRebutsImmoPageComponent } from './pages/liste-rebuts-immo-page/liste-rebuts-immo-page.component';

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
    {
        path: 'assurances',
        children: [
            { path: '', component: ListeAssurancesPageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'affectations',
        children: [
            { path: '', component: ListeAffectationsPageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'sorties-provisoires',
        children: [
            { path: '', component: ListeSortiesProvisoiresPageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'cessions',
        children: [
            { path: '', component: ListeCessionsPageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'rebuts',
        children: [
            { path: '', component: ListeRebutsImmoPageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'inventaires',
        children: [
            { path: '', component: ListeInventairesImmoPageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'reportings',
        children: [
            { path: '', component: ReportingImmoPageComponent, pathMatch: 'full' },
        ]
    },
    { path: ':id', component: DetailsImmobilisationPageComponent, pathMatch: 'full' },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ImmobilisationsRoutingModule { }
