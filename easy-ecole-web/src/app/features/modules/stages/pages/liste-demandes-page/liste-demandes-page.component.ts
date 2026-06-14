import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeStageService } from 'src/app/data/modules/stages/services/demande-stage.service';
import { DemandeStage } from 'src/app/data/modules/stages/models/DemandeStage.model';

@Component({
    selector: 'app-liste-demandes-page',
    templateUrl: './liste-demandes-page.component.html',
    styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {
    demandes: DemandeStage[] = []
    constructor(private demandeStageService: DemandeStageService) {
        super()
        this.getDemandes()
    }
    ngOnInit(): void {}
    getDemandes(): void {
        this.demandeStageService.getAll().subscribe({
            next: (res) => { this.demandes = res },
            error: (err) => { console.log(err) }
        })
    }
}
