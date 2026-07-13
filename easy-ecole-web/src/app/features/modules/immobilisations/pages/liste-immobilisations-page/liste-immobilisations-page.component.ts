import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';

@Component({
    selector: 'app-liste-immobilisations-page',
    templateUrl: './liste-immobilisations-page.component.html',
    styleUrls: ['./liste-immobilisations-page.component.scss']
})
export class ListeImmobilisationsPageComponent extends BaseComponentClass implements OnInit {

    immobilisations: Immobilisation[] = []

    constructor(
        private router: Router,
        private immobilisationService: ImmobilisationService) {
        super()
        this.getImmobilisations()
    }

    ngOnInit(): void {
    }

    private getImmobilisations(): void {
        this.immobilisationService.getAll()
            .subscribe(
                {
                    next: (res) => {
                        this.immobilisations = res
                    },
                    error: (err) => {
                        console.log(err)
                    },
                }
            )
    }

}
