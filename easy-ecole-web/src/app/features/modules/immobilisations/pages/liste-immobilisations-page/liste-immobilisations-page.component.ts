import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';

@Component({
    selector: 'app-liste-immobilisations-page',
    templateUrl: './liste-immobilisations-page.component.html',
    styleUrls: ['./liste-immobilisations-page.component.scss']
})
export class ListeImmobilisationsPageComponent extends BaseComponentClass implements OnInit {

    immobilisations: Immobilisation[] = []
    loading = false
    searchTerm = ''
    filterEtat = ''
    pageSize = 10
    currentPage = 1

    constructor(
        private router: Router,
        private immobilisationService: ImmobilisationService) {
        super()
    }

    ngOnInit(): void {
        this.loadImmobilisations()
    }

    loadImmobilisations(): void {
        this.loading = true
        this.immobilisationService.getAll()
            .subscribe({
                next: (res) => {
                    this.immobilisations = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    get totalValeur(): number {
        return this.immobilisations.reduce((s, i) => s + (i.valeurAcquisition || 0), 0)
    }

    get actifsCount(): number {
        return this.immobilisations.filter(i => i.etat === 'en_service' || i.etat === 'actif').length
    }

    get enMaintenanceCount(): number {
        return this.immobilisations.filter(i => i.etat === 'maintenance' || i.etat === 'en_maintenance').length
    }

    get filteredImmobilisations(): Immobilisation[] {
        const term = this.searchTerm.trim().toLowerCase()
        let list = this.immobilisations

        if (term) {
            list = list.filter((i: Immobilisation) =>
                (i.nom || '').toLowerCase().includes(term) ||
                (i.reference || '').toLowerCase().includes(term)
            )
        }

        if (this.filterEtat) {
            list = list.filter((i: Immobilisation) => i.etat === this.filterEtat)
        }

        return list
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredImmobilisations.length / this.pageSize))
    }

    get pagedImmobilisations(): Immobilisation[] {
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages
        }
        const start = (this.currentPage - 1) * this.pageSize
        return this.filteredImmobilisations.slice(start, start + this.pageSize)
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--
        }
    }

    goToPage(page: number): void {
        this.currentPage = page
    }

    trackByIndex(index: number): number {
        return index
    }

    etatBadge(etat: string): string {
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
