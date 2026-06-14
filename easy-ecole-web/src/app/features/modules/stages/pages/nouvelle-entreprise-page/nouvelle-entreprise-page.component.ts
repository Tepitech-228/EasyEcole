import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EntrepriseService } from 'src/app/data/modules/stages/services/entreprise.service';
import { Entreprise } from 'src/app/data/modules/stages/models/Entreprise.model';

@Component({
    selector: 'app-nouvelle-entreprise-page',
    templateUrl: './nouvelle-entreprise-page.component.html',
    styleUrls: ['./nouvelle-entreprise-page.component.scss']
})
export class NouvelleEntreprisePageComponent extends BaseComponentClass implements OnInit {
    error: boolean = false
    disableButton: boolean = false
    alreadyExists: boolean = false

    form: FormGroup = new FormGroup({
        nom: new FormControl(null, [Validators.required]),
        email: new FormControl(null, []),
        telephone: new FormControl(null, []),
        siteWeb: new FormControl(null, []),
        adresse: new FormControl(null, []),
        description: new FormControl(null, []),
    })

    constructor(private router: Router, private entrepriseService: EntrepriseService) {
        super()
        if (!this.rolesValue.isInstitution) { this.router.navigate(['/stages/entreprises']) }
    }
    ngOnInit(): void {}

    create(): void {
        this.form.markAllAsTouched()
        if (this.form.valid) {
            let entreprise = new Entreprise()
            entreprise.nom = this.form.get('nom')!.value
            entreprise.email = this.form.get('email')!.value
            entreprise.telephone = this.form.get('telephone')!.value
            entreprise.siteWeb = this.form.get('siteWeb')!.value
            entreprise.adresse = this.form.get('adresse')!.value
            entreprise.description = this.form.get('description')!.value
            this.disableButton = true
            this.entrepriseService.create(entreprise).subscribe({
                next: () => { this.router.navigateByUrl("/stages/entreprises") },
                error: (err: HttpErrorResponse) => {
                    this.alreadyExists = err.error?.alreadyExists
                    if (!this.alreadyExists) { this.error = true }
                    setTimeout(() => { this.error = false; this.alreadyExists = false }, 3000)
                },
                complete: () => { this.disableButton = false }
            })
        }
    }
}
