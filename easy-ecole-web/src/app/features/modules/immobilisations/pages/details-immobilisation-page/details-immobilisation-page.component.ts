import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';
import { AmortissementService } from 'src/app/data/modules/immobilisations/services/amortissement.service';

@Component({
    selector: 'app-details-immobilisation-page',
    templateUrl: './details-immobilisation-page.component.html',
    styleUrls: ['./details-immobilisation-page.component.scss']
})
export class DetailsImmobilisationPageComponent extends BaseComponentClass implements OnInit {

    error: boolean = false
    id: string
    immobilisation?: Immobilisation
    loading = false

    successMessage = ''
    errorMessage = ''

    constructor(
        private immobilisationService: ImmobilisationService,
        private amortissementService: AmortissementService,
        private activatedRoute: ActivatedRoute,
        private router: Router) {
        super()
        this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    }

    ngOnInit(): void {
        this.loadImmobilisation()
    }

    loadImmobilisation(): void {
        this.loading = true
        this.immobilisationService.get(this.id)
            .subscribe({
                next: (res) => {
                    this.immobilisation = res
                    this.loading = false
                },
                error: (err: HttpErrorResponse) => {
                    console.log(err)
                    if (err.status == 404) {
                        this.router.navigate(['/immobilisations'])
                    }
                    this.loading = false
                },
            })
    }

    supprimer(): void {
        if (this.immobilisation && confirm('Supprimer cette immobilisation ?')) {
            this.immobilisationService.delete(this.immobilisation.id!).subscribe({
                next: () => {
                    this.router.navigate(['/immobilisations'])
                },
                error: (err) => {
                    console.log(err)
                    this.error = true
                    setTimeout(() => {
                        this.error = false
                    }, 3000)
                }
            })
        }
    }

    genererAmortissements(): void {
        this.amortissementService.genererPourImmobilisation(this.id)
            .subscribe({
                next: () => {
                    this.successMessage = 'Amortissements générés avec succès'
                    setTimeout(() => this.successMessage = '', 3000)
                },
                error: () => {
                    this.errorMessage = 'Erreur lors de la génération des amortissements'
                    setTimeout(() => this.errorMessage = '', 3000)
                }
            })
    }

    get etatBadge(): string {
        const etat = this.immobilisation?.etat || 'hors_service'
        const map: Record<string, string> = {
            'en_service': 'bg-green-100 text-green-700',
            'actif': 'bg-green-100 text-green-700',
            'maintenance': 'bg-yellow-100 text-yellow-700',
            'en_maintenance': 'bg-yellow-100 text-yellow-700',
            'hors_service': 'bg-red-100 text-red-700',
            'reforme': 'bg-gray-100 text-gray-700'
        }
        return map[etat] || 'bg-gray-100 text-gray-700'
    }

}
