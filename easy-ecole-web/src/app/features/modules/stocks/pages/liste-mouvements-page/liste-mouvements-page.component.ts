import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { MouvementStockService } from 'src/app/data/modules/stocks/services/mouvement-stock.service';
import { MouvementStock } from 'src/app/data/modules/stocks/models/MouvementStock.model';

@Component({
    selector: 'app-liste-mouvements-page',
    templateUrl: './liste-mouvements-page.component.html',
    styleUrls: ['./liste-mouvements-page.component.scss']
})
export class ListeMouvementsPageComponent extends BaseComponentClass implements OnInit {
    mouvements: MouvementStock[] = []
    constructor(private mouvementStockService: MouvementStockService) {
        super()
        this.getMouvements()
    }
    ngOnInit(): void {}
    getMouvements(): void {
        this.mouvementStockService.getAll().subscribe({
            next: (res) => { this.mouvements = res },
            error: (err) => { console.log(err) }
        })
    }
}
