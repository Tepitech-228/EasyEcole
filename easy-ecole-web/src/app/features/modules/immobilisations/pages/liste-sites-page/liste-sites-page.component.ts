import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Site } from 'src/app/data/modules/immobilisations/models/Site.model';
import { SiteService } from 'src/app/data/modules/immobilisations/services/site.service';

@Component({
    selector: 'app-liste-sites-page',
    templateUrl: './liste-sites-page.component.html',
    styleUrls: ['./liste-sites-page.component.scss']
})
export class ListeSitesPageComponent extends BaseComponentClass implements OnInit {

    sites: Site[] = []

    constructor(
        private router: Router,
        private siteService: SiteService) {
        super()
        this.getSites()
    }

    ngOnInit(): void {
    }

    private getSites(): void {
        this.siteService.getAll()
            .subscribe(
                {
                    next: (res) => {
                        this.sites = res
                    },
                    error: (err) => {
                        console.log(err)
                    },
                }
            )
    }

}
