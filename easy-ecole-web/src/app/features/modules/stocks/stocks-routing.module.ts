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
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class StocksRoutingModule { }
