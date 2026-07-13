import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { FournisseurService } from 'src/app/data/modules/stocks/services/fournisseur.service';
import { Fournisseur } from 'src/app/data/modules/stocks/models/Fournisseur.model';

@Component({
    selector: 'app-nouveau-fournisseur-page',
    templateUrl: './nouveau-fournisseur-page.component.html',
    styleUrls: ['./nouveau-fournisseur-page.component.scss']
})
export class NouveauFournisseurPageComponent extends BaseComponentClass implements OnInit {
    error: boolean = false
    disableButton: boolean = false
    alreadyExists: boolean = false
    form: FormGroup = new FormGroup({
        nom: new FormControl(null, [Validators.required]),
        contact: new FormControl(null, []),
        email: new FormControl(null, []),
        telephone: new FormControl(null, []),
        adresse: new FormControl(null, []),
    })
    constructor(private router: Router, private fournisseurService: FournisseurService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isCaissierBanque) { this.router.navigate(['/stocks/fournisseurs']) }
    }
    ngOnInit(): void {}
    create(): void {
        this.form.markAllAsTouched()
        if (this.form.valid) {
            let fournisseur = new Fournisseur()
            fournisseur.nom = this.form.get('nom')!.value
            fournisseur.contact = this.form.get('contact')!.value
            fournisseur.email = this.form.get('email')!.value
            fournisseur.telephone = this.form.get('telephone')!.value
            fournisseur.adresse = this.form.get('adresse')!.value
            this.disableButton = true
            this.fournisseurService.create(fournisseur).subscribe({
                next: () => { this.router.navigateByUrl("/stocks/fournisseurs") },
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
