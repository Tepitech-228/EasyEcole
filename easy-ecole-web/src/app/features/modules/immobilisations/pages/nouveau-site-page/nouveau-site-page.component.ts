import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Site } from 'src/app/data/modules/immobilisations/models/Site.model';
import { SiteService } from 'src/app/data/modules/immobilisations/services/site.service';

@Component({
    selector: 'app-nouveau-site-page',
    templateUrl: './nouveau-site-page.component.html',
    styleUrls: ['./nouveau-site-page.component.scss']
})
export class NouveauSitePageComponent extends BaseComponentClass implements OnInit {

    error: boolean = false
    alreadyExists: boolean = false

    siteForm: FormGroup = new FormGroup({
        nom: new FormControl(null, [Validators.required]),
        adresse: new FormControl(null, []),
    })

    constructor(
        private router: Router,
        private siteService: SiteService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
            this.router.navigate(['/immobilisations/sites'])
        }
    }

    ngOnInit(): void {
    }

    create(): void {
        this.siteForm.markAllAsTouched()
        if (this.siteForm.valid) {
            let site: Site = new Site()
            site.nom = this.siteForm.get('nom')!.value
            site.adresse = this.siteForm.get('adresse')!.value

            this.siteService.create(site).subscribe({
                next: (res) => {
                    this.router.navigate(['/immobilisations/sites'])
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
