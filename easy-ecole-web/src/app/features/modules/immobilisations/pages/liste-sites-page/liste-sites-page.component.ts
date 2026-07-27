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
    loading = false
    searchTerm = ''

    constructor(
        private router: Router,
        private siteService: SiteService) {
        super()
    }

    ngOnInit(): void {
        this.loadSites()
    }

    loadSites(): void {
        this.loading = true
        this.siteService.getAll()
            .subscribe({
                next: (res) => {
                    this.sites = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    get totalSites(): number {
        return this.sites.length
    }

    getActiveSitesCount(): number {
        return this.sites.filter(s => (s as any).actif !== false).length
    }

    getAvecImmobilisationsCount(): number {
        return this.sites.filter(s => (s as any).immobilisations && (s as any).immobilisations.length > 0).length
    }

}
