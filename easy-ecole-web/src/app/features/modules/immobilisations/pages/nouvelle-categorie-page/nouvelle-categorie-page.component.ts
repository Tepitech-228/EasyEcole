import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CategorieImmobilisation } from 'src/app/data/modules/immobilisations/models/CategorieImmobilisation.model';
import { CategorieImmobilisationService } from 'src/app/data/modules/immobilisations/services/categorie-immobilisation.service';

@Component({
    selector: 'app-nouvelle-categorie-page',
    templateUrl: './nouvelle-categorie-page.component.html',
    styleUrls: ['./nouvelle-categorie-page.component.scss']
})
export class NouvelleCategoriePageComponent extends BaseComponentClass implements OnInit {

    error: boolean = false

    categorieForm: FormGroup = new FormGroup({
        nom: new FormControl(null, [Validators.required]),
        description: new FormControl(null, []),
        tauxAmortissement: new FormControl(null, []),
        dureeVie: new FormControl(null, []),
    })

    constructor(
        private router: Router,
        private categorieImmobilisationService: CategorieImmobilisationService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
            this.router.navigate(['/immobilisations/categories'])
        }
    }

    ngOnInit(): void {
    }

    create(): void {
        this.categorieForm.markAllAsTouched()
        if (this.categorieForm.valid) {
            let categorie: CategorieImmobilisation = new CategorieImmobilisation()
            categorie.nom = this.categorieForm.get('nom')!.value
            categorie.description = this.categorieForm.get('description')!.value
            categorie.tauxAmortissement = this.categorieForm.get('tauxAmortissement')!.value
            categorie.dureeVie = this.categorieForm.get('dureeVie')!.value

            this.categorieImmobilisationService.create(categorie).subscribe({
                next: (res) => {
                    this.router.navigate(['/immobilisations/categories'])
                },
                error: (err: HttpErrorResponse) => {
                    console.log(err)
                    this.error = true
                    setTimeout(() => { this.error = false }, 3000)
                }
            })
        }
    }

}
