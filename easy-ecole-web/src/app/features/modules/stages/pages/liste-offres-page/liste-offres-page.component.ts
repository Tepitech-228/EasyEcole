import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { OffreStageService } from 'src/app/data/modules/stages/services/offre-stage.service';
import { OffreStage } from 'src/app/data/modules/stages/models/OffreStage.model';

@Component({
    selector: 'app-liste-offres-page',
    templateUrl: './liste-offres-page.component.html',
    styleUrls: ['./liste-offres-page.component.scss']
})
export class ListeOffresPageComponent extends BaseComponentClass implements OnInit {
    offres: OffreStage[] = []
    constructor(private offreStageService: OffreStageService) {
        super()
        this.getOffres()
    }
    ngOnInit(): void {}
    getOffres(): void {
        this.offreStageService.getAll().subscribe({
            next: (res) => { this.offres = res },
            error: (err) => { console.log(err) }
        })
    }
}
