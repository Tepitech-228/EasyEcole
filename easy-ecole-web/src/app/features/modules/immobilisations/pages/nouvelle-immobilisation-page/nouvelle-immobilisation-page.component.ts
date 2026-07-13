import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CategorieImmobilisation } from 'src/app/data/modules/immobilisations/models/CategorieImmobilisation.model';
import { Departement } from 'src/app/data/modules/immobilisations/models/Departement.model';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { Localisation } from 'src/app/data/modules/immobilisations/models/Localisation.model';
import { Site } from 'src/app/data/modules/immobilisations/models/Site.model';
import { CategorieImmobilisationService } from 'src/app/data/modules/immobilisations/services/categorie-immobilisation.service';
import { DepartementService } from 'src/app/data/modules/immobilisations/services/departement.service';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';
import { LocalisationService } from 'src/app/data/modules/immobilisations/services/localisation.service';
import { SiteService } from 'src/app/data/modules/immobilisations/services/site.service';

@Component({
    selector: 'app-nouvelle-immobilisation-page',
    templateUrl: './nouvelle-immobilisation-page.component.html',
    styleUrls: ['./nouvelle-immobilisation-page.component.scss']
})
export class NouvelleImmobilisationPageComponent extends BaseComponentClass implements OnInit {

    error: boolean = false
    alreadyExists: boolean = false

    categories: CategorieImmobilisation[] = []
    sites: Site[] = []
    departements: Departement[] = []
    localisations: Localisation[] = []

    immobilisationForm: FormGroup = new FormGroup({
        nom: new FormControl(null, [Validators.required]),
        reference: new FormControl(null, [Validators.required]),
        description: new FormControl(null, []),
        categorieId: new FormControl(null, []),
        siteId: new FormControl(null, []),
        departementId: new FormControl(null, []),
        localisationId: new FormControl(null, []),
        etat: new FormControl(null, []),
        dateMiseEnService: new FormControl(null, []),
        valeurAcquisition: new FormControl(null, []),
        responsableNom: new FormControl(null, []),
    })

    constructor(
        private router: Router,
        private immobilisationService: ImmobilisationService,
        private categorieImmobilisationService: CategorieImmobilisationService,
        private siteService: SiteService,
        private departementService: DepartementService,
        private localisationService: LocalisationService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isCaissierBanque && !this.rolesValue.isAdmin) {
            this.router.navigate(['/immobilisations'])
        }
        else {
            this.getCategories()
            this.getSites()
            this.getDepartements()
            this.getLocalisations()
        }
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

    private getSites(): void {
        this.siteService.getAll()
            .subscribe(
                {
                    next: (res) => {
                        this.sites = res
                    },
                    error: (err) => {
                        console.log(err)
                    },
                }
            )
    }

    private getDepartements(): void {
        this.departementService.getAll()
            .subscribe(
                {
                    next: (res) => {
                        this.departements = res
                    },
                    error: (err) => {
                        console.log(err)
                    },
                }
            )
    }

    private getLocalisations(): void {
        this.localisationService.getAll()
            .subscribe(
                {
                    next: (res) => {
                        this.localisations = res
                    },
                    error: (err) => {
                        console.log(err)
                    },
                }
            )
    }

    create(): void {
        this.immobilisationForm.markAllAsTouched()
        if (this.immobilisationForm.valid) {
            let immobilisation: Immobilisation = new Immobilisation()
            immobilisation.nom = this.immobilisationForm.get('nom')!.value
            immobilisation.reference = this.immobilisationForm.get('reference')!.value
            immobilisation.description = this.immobilisationForm.get('description')!.value
            immobilisation.categorieId = this.immobilisationForm.get('categorieId')!.value
            immobilisation.siteId = this.immobilisationForm.get('siteId')!.value
            immobilisation.departementId = this.immobilisationForm.get('departementId')!.value
            immobilisation.localisationId = this.immobilisationForm.get('localisationId')!.value
            immobilisation.etat = this.immobilisationForm.get('etat')!.value
            immobilisation.dateMiseEnService = this.immobilisationForm.get('dateMiseEnService')!.value
            immobilisation.valeurAcquisition = this.immobilisationForm.get('valeurAcquisition')!.value
            immobilisation.responsableNom = this.immobilisationForm.get('responsableNom')!.value

            this.immobilisationService.create(immobilisation).subscribe({
                next: (res) => {
                    this.router.navigate(['/immobilisations/' + res.id])
                },
                error: (err: HttpErrorResponse) => {
                    console.log(err)
                    this.alreadyExists = err.error.alreadyExists
                    if (!this.alreadyExists) {
                        this.error = true
                    }

                    setTimeout(() => {
                        this.error = false
                        this.alreadyExists = false
                    }, 3000)
                }
            })
        }
    }

}
