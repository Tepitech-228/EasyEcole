import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';

@Component({
    selector: 'app-details-immobilisation-page',
    templateUrl: './details-immobilisation-page.component.html',
    styleUrls: ['./details-immobilisation-page.component.scss']
})
export class DetailsImmobilisationPageComponent extends BaseComponentClass implements OnInit {

    error: boolean = false

    id: string
    immobilisation?: Immobilisation

    constructor(
        private immobilisationService: ImmobilisationService,
        private activatedRoute: ActivatedRoute,
        private router: Router) {
        super()
        this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
        this.getImmobilisation()
    }

    ngOnInit(): void {
    }

    getImmobilisation(): void {
        this.immobilisationService.get(this.id)
            .subscribe(
                {
                    next: (res) => {
                        this.immobilisation = res
                    },
                    error: (err: HttpErrorResponse) => {
                        console.log(err)
                        if (err.status == 404) {
                            this.router.navigate(['/immobilisations'])
                        }
                    },
                }
            )
    }

    supprimer(): void {
        if (this.immobilisation) {
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

}
