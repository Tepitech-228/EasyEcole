import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeStageService } from 'src/app/data/modules/stages/services/demande-stage.service';
import { DemandeStage } from 'src/app/data/modules/stages/models/DemandeStage.model';

@Component({
    selector: 'app-details-demande-page',
    templateUrl: './details-demande-page.component.html',
    styleUrls: ['./details-demande-page.component.scss']
})
export class DetailsDemandePageComponent extends BaseComponentClass implements OnInit {
    id: string
    demande?: DemandeStage
    error: boolean = false

    constructor(
        private demandeStageService: DemandeStageService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        super()
        this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
        this.getDemande(this.id)
    }
    ngOnInit(): void {}

    getDemande(id: string): void {
        this.demandeStageService.get(id).subscribe({
            next: (res) => { this.demande = res },
            error: (err: HttpErrorResponse) => {
                this.error = true
                if (err.status == 404) { this.router.navigate(['/stages/demandes']) }
            }
        })
    }

    delete(): void {
        this.demandeStageService.delete(this.id).subscribe({
            next: () => { this.router.navigate(['/stages/demandes']) },
            error: (err) => { console.log(err) }
        })
    }
}
