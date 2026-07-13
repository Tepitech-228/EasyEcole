import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { MouvementStockService } from 'src/app/data/modules/stocks/services/mouvement-stock.service';
import { MouvementStock } from 'src/app/data/modules/stocks/models/MouvementStock.model';
import { Site } from 'src/app/data/modules/immobilisations/models/Site.model';
import { SiteService } from 'src/app/data/modules/immobilisations/services/site.service';

@Component({
    selector: 'app-nouveau-mouvement-page',
    templateUrl: './nouveau-mouvement-page.component.html',
    styleUrls: ['./nouveau-mouvement-page.component.scss']
})
export class NouveauMouvementPageComponent extends BaseComponentClass implements OnInit {
    error: boolean = false
    disableButton: boolean = false
    alreadyExists: boolean = false
    sites: Site[] = []
    form: FormGroup = new FormGroup({
        articleId: new FormControl(null, [Validators.required]),
        type: new FormControl(null, [Validators.required]),
        quantite: new FormControl(null, [Validators.required]),
        motif: new FormControl(null, []),
        fournisseurId: new FormControl(null, []),
        siteId: new FormControl(null, []),
        prixUnitaire: new FormControl(null, []),
    })
    constructor(private router: Router, private mouvementStockService: MouvementStockService, private siteService: SiteService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isCaissierBanque) { this.router.navigate(['/stocks/mouvements']) }
        this.getSites()
    }
    ngOnInit(): void {}
    private getSites(): void {
        this.siteService.getAll().subscribe({
            next: (res) => { this.sites = res },
            error: (err) => { console.log(err) }
        })
    }
    create(): void {
        this.form.markAllAsTouched()
        if (this.form.valid) {
            let mouvement = new MouvementStock()
            mouvement.articleId = this.form.get('articleId')!.value
            mouvement.type = this.form.get('type')!.value
            mouvement.quantite = this.form.get('quantite')!.value
            mouvement.motif = this.form.get('motif')!.value
            mouvement.fournisseurId = this.form.get('fournisseurId')!.value
            mouvement.siteId = this.form.get('siteId')!.value
            mouvement.prixUnitaire = this.form.get('prixUnitaire')!.value
            this.disableButton = true
            this.mouvementStockService.create(mouvement).subscribe({
                next: () => { this.router.navigateByUrl("/stocks/mouvements") },
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
