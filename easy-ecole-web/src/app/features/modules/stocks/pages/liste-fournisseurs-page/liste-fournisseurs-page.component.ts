import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { FournisseurService } from 'src/app/data/modules/stocks/services/fournisseur.service';
import { Fournisseur } from 'src/app/data/modules/stocks/models/Fournisseur.model';

@Component({
    selector: 'app-liste-fournisseurs-page',
    templateUrl: './liste-fournisseurs-page.component.html',
    styleUrls: ['./liste-fournisseurs-page.component.scss']
})
export class ListeFournisseursPageComponent extends BaseComponentClass implements OnInit {
    fournisseurs: Fournisseur[] = []
    constructor(private fournisseurService: FournisseurService) {
        super()
        this.getFournisseurs()
    }
    ngOnInit(): void {}
    getFournisseurs(): void {
        this.fournisseurService.getAll().subscribe({
            next: (res) => { this.fournisseurs = res },
            error: (err) => { console.log(err) }
        })
    }
}
