import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { OffreStageService } from 'src/app/data/modules/stages/services/offre-stage.service';
import { OffreStage } from 'src/app/data/modules/stages/models/OffreStage.model';

@Component({
    selector: 'app-nouvelle-offre-page',
    templateUrl: './nouvelle-offre-page.component.html',
    styleUrls: ['./nouvelle-offre-page.component.scss']
})
export class NouvelleOffrePageComponent extends BaseComponentClass implements OnInit {
    error: boolean = false
    disableButton: boolean = false
    alreadyExists: boolean = false

    form: FormGroup = new FormGroup({
        titre: new FormControl(null, [Validators.required]),
        description: new FormControl(null, []),
        dateDebut: new FormControl(null, [Validators.required]),
        dateFin: new FormControl(null, [Validators.required]),
        lieu: new FormControl(null, []),
        nombrePlaces: new FormControl(null, []),
    })

    constructor(private router: Router, private offreStageService: OffreStageService) {
        super()
        if (!this.rolesValue.isInstitution) { this.router.navigate(['/stages/offres']) }
    }
    ngOnInit(): void {}

    create(): void {
        this.form.markAllAsTouched()
        if (this.form.valid) {
            let offre = new OffreStage()
            offre.titre = this.form.get('titre')!.value
            offre.description = this.form.get('description')!.value
            offre.dateDebut = this.form.get('dateDebut')!.value
            offre.dateFin = this.form.get('dateFin')!.value
            offre.lieu = this.form.get('lieu')!.value
            offre.nombrePlaces = this.form.get('nombrePlaces')!.value
            this.disableButton = true
            this.offreStageService.create(offre).subscribe({
                next: () => { this.router.navigateByUrl("/stages/offres") },
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
