import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { ListeArticlesPageComponent } from './pages/liste-articles-page/liste-articles-page.component';
import { NouvelArticlePageComponent } from './pages/nouvel-article-page/nouvel-article-page.component';
import { DetailsArticlePageComponent } from './pages/details-article-page/details-article-page.component';
import { ListeMouvementsPageComponent } from './pages/liste-mouvements-page/liste-mouvements-page.component';
import { NouveauMouvementPageComponent } from './pages/nouveau-mouvement-page/nouveau-mouvement-page.component';
import { ListeFournisseursPageComponent } from './pages/liste-fournisseurs-page/liste-fournisseurs-page.component';
import { NouveauFournisseurPageComponent } from './pages/nouveau-fournisseur-page/nouveau-fournisseur-page.component';
import { ListeBesoinsPageComponent } from './pages/liste-besoins-page/liste-besoins-page.component';
import { ListeDemandesPrixPageComponent } from './pages/liste-demandes-prix-page/liste-demandes-prix-page.component';
import { ListeRebutsPageComponent } from './pages/liste-rebuts-page/liste-rebuts-page.component';
import { ListeCorrectionsStockPageComponent } from './pages/liste-corrections-stock-page/liste-corrections-stock-page.component';
import { ListeInventairesStockPageComponent } from './pages/liste-inventaires-stock-page/liste-inventaires-stock-page.component';
import { ReportingStockPageComponent } from './pages/reporting-stock-page/reporting-stock-page.component';
import { ListeTransfertsStockPageComponent } from './pages/liste-transferts-stock-page/liste-transferts-stock-page.component';
import { ListeCategoriesArticlesPageComponent } from './pages/liste-categories-articles-page/liste-categories-articles-page.component';
import { CycleVieArticlesPageComponent } from './pages/cycle-vie-articles-page/cycle-vie-articles-page.component';

const routes: Routes = [
    {
        path: 'articles',
        children: [
            { path: '', component: ListeArticlesPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouvelArticlePageComponent, pathMatch: 'full' }]
            },
            { path: ':id', component: DetailsArticlePageComponent, pathMatch: 'full' },
        ]
    },
    {
        path: 'mouvements',
        children: [
            { path: '', component: ListeMouvementsPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouveauMouvementPageComponent, pathMatch: 'full' }]
            },
        ]
    },
    {
        path: 'fournisseurs',
        children: [
            { path: '', component: ListeFournisseursPageComponent, pathMatch: 'full' },
            {
                path: 'nouveau',
                canActivateChild: [AuthGuard],
                children: [{ path: '', component: NouveauFournisseurPageComponent, pathMatch: 'full' }]
            },
        ]
    },
    { path: 'besoins', component: ListeBesoinsPageComponent, pathMatch: 'full' },
    { path: 'demandes-prix', component: ListeDemandesPrixPageComponent, pathMatch: 'full' },
    { path: 'rebuts', component: ListeRebutsPageComponent, pathMatch: 'full' },
    { path: 'corrections-stock', component: ListeCorrectionsStockPageComponent, pathMatch: 'full' },
    { path: 'inventaires', component: ListeInventairesStockPageComponent, pathMatch: 'full' },
    { path: 'transferts', component: ListeTransfertsStockPageComponent, pathMatch: 'full' },
    { path: 'categories', component: ListeCategoriesArticlesPageComponent, pathMatch: 'full' },
    { path: 'cycle-vie', component: CycleVieArticlesPageComponent, pathMatch: 'full' },
    { path: 'reportings', component: ReportingStockPageComponent, pathMatch: 'full' },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class StocksRoutingModule { }
