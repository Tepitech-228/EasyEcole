import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EntrepriseService } from 'src/app/data/modules/stages/services/entreprise.service';
import { Entreprise } from 'src/app/data/modules/stages/models/Entreprise.model';

@Component({
    selector: 'app-details-entreprise-page',
    templateUrl: './details-entreprise-page.component.html',
    styleUrls: ['./details-entreprise-page.component.scss']
})
export class DetailsEntreprisePageComponent extends BaseComponentClass implements OnInit {
    id: string
    entreprise?: Entreprise
    error: boolean = false

    constructor(
        private entrepriseService: EntrepriseService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        super()
        this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
        this.getEntreprise(this.id)
    }
    ngOnInit(): void {}

    getEntreprise(id: string): void {
        this.entrepriseService.get(id).subscribe({
            next: (res) => { this.entreprise = res },
            error: (err: HttpErrorResponse) => {
                this.error = true
                if (err.status == 404) { this.router.navigate(['/stages/entreprises']) }
            }
        })
    }

    delete(): void {
        this.entrepriseService.delete(this.id).subscribe({
            next: () => { this.router.navigate(['/stages/entreprises']) },
            error: (err) => { console.log(err) }
        })
    }
}
