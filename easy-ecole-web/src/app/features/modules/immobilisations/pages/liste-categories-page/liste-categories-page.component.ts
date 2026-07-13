import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CategorieImmobilisation } from 'src/app/data/modules/immobilisations/models/CategorieImmobilisation.model';
import { CategorieImmobilisationService } from 'src/app/data/modules/immobilisations/services/categorie-immobilisation.service';

@Component({
    selector: 'app-liste-categories-page',
    templateUrl: './liste-categories-page.component.html',
    styleUrls: ['./liste-categories-page.component.scss']
})
export class ListeCategoriesPageComponent extends BaseComponentClass implements OnInit {

    categories: CategorieImmobilisation[] = []

    constructor(
        private categorieImmobilisationService: CategorieImmobilisationService) {
        super()
        this.getCategories()
    }

    ngOnInit(): void {
    }

    private getCategories(): void {
        this.categorieImmobilisationService.getAll()
            .subscribe(
                {
                    next: (res) => {
                        this.categories = res
                    },
                    error: (err) => {
                        console.log(err)
                    },
                }
            )
    }

}
