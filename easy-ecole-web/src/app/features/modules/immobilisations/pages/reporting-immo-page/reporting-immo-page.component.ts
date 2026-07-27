import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';
import { AssuranceService } from 'src/app/data/modules/immobilisations/services/assurance.service';
import { AffectationService } from 'src/app/data/modules/immobilisations/services/affectation.service';
import { AssuranceImmobilisation } from 'src/app/data/modules/immobilisations/models/AssuranceImmobilisation.model';
import { AffectationImmobilisation } from 'src/app/data/modules/immobilisations/models/AffectationImmobilisation.model';

@Component({
    selector: 'app-reporting-immo-page',
    templateUrl: './reporting-immo-page.component.html',
    styleUrls: ['./reporting-immo-page.component.scss']
})
export class ReportingImmoPageComponent extends BaseComponentClass implements OnInit {

    immobilisations: Immobilisation[] = []
    assurances: AssuranceImmobilisation[] = []
    affectations: AffectationImmobilisation[] = []
    loading = false

    constructor(
        private immobilisationService: ImmobilisationService,
        private assuranceService: AssuranceService,
        private affectationService: AffectationService) {
        super()
    }

    ngOnInit(): void {
        this.loadAll()
    }

    loadAll(): void {
        this.loading = true
        this.immobilisationService.getAll().subscribe({
            next: (res) => { this.immobilisations = res; this.checkLoading() },
            error: () => this.checkLoading()
        })
        this.assuranceService.getAll().subscribe({
            next: (res) => { this.assurances = res; this.checkLoading() },
            error: () => this.checkLoading()
        })
        this.affectationService.getAll().subscribe({
            next: (res) => { this.affectations = res; this.checkLoading() },
            error: () => this.checkLoading()
        })
    }

    private loadedCount = 0
    private checkLoading(): void {
        this.loadedCount++
        if (this.loadedCount >= 3) this.loading = false
    }

    get totalImmobilisations(): number {
        return this.immobilisations.length
    }

    get valeurTotale(): number {
        return this.immobilisations.reduce((s, i) => s + (i.valeurAcquisition || 0), 0)
    }

    get assurancesActives(): number {
        return this.assurances.filter(a => a.statut === 'Active').length
    }

    get affectationsEnCours(): number {
        return this.affectations.filter(a => a.statut === 'En cours' || !a.statut).length
    }

    get enServiceCount(): number {
        return this.immobilisations.filter(i => i.etat === 'en_service' || i.etat === 'actif').length
    }

    get enMaintenanceCount(): number {
        return this.immobilisations.filter(i => i.etat === 'maintenance' || i.etat === 'en_maintenance').length
    }

    get horsServiceCount(): number {
        return this.immobilisations.filter(i => i.etat === 'hors_service' || i.etat === 'reforme').length
    }
}
