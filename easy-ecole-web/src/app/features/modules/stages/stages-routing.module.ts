import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { ListeOffresPageComponent } from './pages/liste-offres-page/liste-offres-page.component';
import { NouvelleOffrePageComponent } from './pages/nouvelle-offre-page/nouvelle-offre-page.component';
import { DetailsOffrePageComponent } from './pages/details-offre-page/details-offre-page.component';
import { ListeDemandesPageComponent } from './pages/liste-demandes-page/liste-demandes-page.component';
import { DetailsDemandePageComponent } from './pages/details-demande-page/details-demande-page.component';
import { ListeEntreprisesPageComponent } from './pages/liste-entreprises-page/liste-entreprises-page.component';
import { NouvelleEntreprisePageComponent } from './pages/nouvelle-entreprise-page/nouvelle-entreprise-page.component';
import { DetailsEntreprisePageComponent } from './pages/details-entreprise-page/details-entreprise-page.component';

const routes: Routes = [
    {
        path: 'offres',
        children: [
            { path: '', component: ListeOffresPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouvelleOffrePageComponent, pathMatch: 'full' }]
            },
            { path: ':id', component: DetailsOffrePageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'demandes',
        children: [
            { path: '', component: ListeDemandesPageComponent, pathMatch: 'full' },
            { path: ':id', component: DetailsDemandePageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'entreprises',
        children: [
            { path: '', component: ListeEntreprisesPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouvelleEntreprisePageComponent, pathMatch: 'full' }]
            },
            { path: ':id', component: DetailsEntreprisePageComponent, pathMatch: 'full' },
        ]
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class StagesRoutingModule { }
