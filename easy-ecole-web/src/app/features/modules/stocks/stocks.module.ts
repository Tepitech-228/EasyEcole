import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StocksRoutingModule } from './stocks-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListeArticlesPageComponent } from './pages/liste-articles-page/liste-articles-page.component';
import { NouvelArticlePageComponent } from './pages/nouvel-article-page/nouvel-article-page.component';
import { DetailsArticlePageComponent } from './pages/details-article-page/details-article-page.component';
import { ListeMouvementsPageComponent } from './pages/liste-mouvements-page/liste-mouvements-page.component';
import { NouveauMouvementPageComponent } from './pages/nouveau-mouvement-page/nouveau-mouvement-page.component';
import { ListeFournisseursPageComponent } from './pages/liste-fournisseurs-page/liste-fournisseurs-page.component';
import { NouveauFournisseurPageComponent } from './pages/nouveau-fournisseur-page/nouveau-fournisseur-page.component';

@NgModule({
    declarations: [
        ListeArticlesPageComponent, NouvelArticlePageComponent, DetailsArticlePageComponent,
        ListeMouvementsPageComponent, NouveauMouvementPageComponent,
        ListeFournisseursPageComponent, NouveauFournisseurPageComponent,
    ],
    imports: [CommonModule, StocksRoutingModule, SharedModule]
})
export class StocksModule { }
