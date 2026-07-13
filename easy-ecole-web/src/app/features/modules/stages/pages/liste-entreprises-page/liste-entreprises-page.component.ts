import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EntrepriseService } from 'src/app/data/modules/stages/services/entreprise.service';
import { Entreprise } from 'src/app/data/modules/stages/models/Entreprise.model';

@Component({
    selector: 'app-liste-entreprises-page',
    templateUrl: './liste-entreprises-page.component.html',
    styleUrls: ['./liste-entreprises-page.component.scss']
})
export class ListeEntreprisesPageComponent extends BaseComponentClass implements OnInit {
    entreprises: Entreprise[] = []
    constructor(private entrepriseService: EntrepriseService) {
        super()
        this.getEntreprises()
    }
    ngOnInit(): void {}
    getEntreprises(): void {
        this.entrepriseService.getAll().subscribe({
            next: (res) => { this.entreprises = res },
            error: (err) => { console.log(err) }
        })
    }
}
