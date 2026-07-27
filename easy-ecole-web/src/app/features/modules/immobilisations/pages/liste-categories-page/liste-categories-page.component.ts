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
    loading = false
    searchTerm = ''

    constructor(
        private categorieImmobilisationService: CategorieImmobilisationService) {
        super()
    }

    ngOnInit(): void {
        this.loadCategories()
    }

    loadCategories(): void {
        this.loading = true
        this.categorieImmobilisationService.getAll()
            .subscribe({
                next: (res) => {
                    this.categories = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    get totalCategories(): number {
        return this.categories.length
    }

    getHasAmortissementCount(): number {
        return this.categories.filter(c => c.tauxAmortissement && c.tauxAmortissement > 0).length
    }

    getAvgDureeVie(): number {
        if (!this.categories.length) return 0
        const sum = this.categories.reduce((s, c) => s + (c.dureeVie || 0), 0)
        return Math.round(sum / this.categories.length)
    }

}
