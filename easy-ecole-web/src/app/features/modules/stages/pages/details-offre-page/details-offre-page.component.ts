import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { OffreStageService } from 'src/app/data/modules/stages/services/offre-stage.service';
import { OffreStage } from 'src/app/data/modules/stages/models/OffreStage.model';

@Component({
    selector: 'app-details-offre-page',
    templateUrl: './details-offre-page.component.html',
    styleUrls: ['./details-offre-page.component.scss']
})
export class DetailsOffrePageComponent extends BaseComponentClass implements OnInit {
    id: string
    offre?: OffreStage
    error: boolean = false

    constructor(
        private offreStageService: OffreStageService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        super()
        this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
        this.getOffre(this.id)
    }
    ngOnInit(): void {}

    getOffre(id: string): void {
        this.offreStageService.get(id).subscribe({
            next: (res) => { this.offre = res },
            error: (err: HttpErrorResponse) => {
                this.error = true
                if (err.status == 404) { this.router.navigate(['/stages/offres']) }
            }
        })
    }

    delete(): void {
        this.offreStageService.delete(this.id).subscribe({
            next: () => { this.router.navigate(['/stages/offres']) },
            error: (err) => { console.log(err) }
        })
    }
}
