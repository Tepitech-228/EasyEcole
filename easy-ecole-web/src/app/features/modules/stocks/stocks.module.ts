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
import { ListeBesoinsPageComponent } from './pages/liste-besoins-page/liste-besoins-page.component';
import { ListeDemandesPrixPageComponent } from './pages/liste-demandes-prix-page/liste-demandes-prix-page.component';
import { ListeRebutsPageComponent } from './pages/liste-rebuts-page/liste-rebuts-page.component';
import { ListeCorrectionsStockPageComponent } from './pages/liste-corrections-stock-page/liste-corrections-stock-page.component';
import { ListeInventairesStockPageComponent } from './pages/liste-inventaires-stock-page/liste-inventaires-stock-page.component';
import { ReportingStockPageComponent } from './pages/reporting-stock-page/reporting-stock-page.component';
import { ListeTransfertsStockPageComponent } from './pages/liste-transferts-stock-page/liste-transferts-stock-page.component';
import { ListeCategoriesArticlesPageComponent } from './pages/liste-categories-articles-page/liste-categories-articles-page.component';
import { CycleVieArticlesPageComponent } from './pages/cycle-vie-articles-page/cycle-vie-articles-page.component';

@NgModule({
    declarations: [
        ListeArticlesPageComponent, NouvelArticlePageComponent, DetailsArticlePageComponent,
        ListeMouvementsPageComponent, NouveauMouvementPageComponent,
        ListeFournisseursPageComponent, NouveauFournisseurPageComponent,
        ListeBesoinsPageComponent, ListeDemandesPrixPageComponent, ListeRebutsPageComponent,
        ListeCorrectionsStockPageComponent, ListeInventairesStockPageComponent, ReportingStockPageComponent,
        ListeTransfertsStockPageComponent, ListeCategoriesArticlesPageComponent, CycleVieArticlesPageComponent,
    ],
    imports: [CommonModule, StocksRoutingModule, SharedModule]
})
export class StocksModule { }
