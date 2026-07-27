import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Maintenance } from 'src/app/data/modules/immobilisations/models/Maintenance.model';
import { MaintenanceService } from 'src/app/data/modules/immobilisations/services/maintenance.service';

@Component({
    selector: 'app-liste-maintenances-page',
    templateUrl: './liste-maintenances-page.component.html',
    styleUrls: ['./liste-maintenances-page.component.scss']
})
export class ListeMaintenancesPageComponent extends BaseComponentClass implements OnInit {

    maintenances: Maintenance[] = []
    loading = false
    searchTerm = ''

    constructor(
        private maintenanceService: MaintenanceService) {
        super()
    }

    ngOnInit(): void {
        this.loadMaintenances()
    }

    loadMaintenances(): void {
        this.loading = true
        this.maintenanceService.getAll()
            .subscribe({
                next: (res) => {
                    this.maintenances = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    get totalMaintenances(): number {
        return this.maintenances.length
    }

    get totalCout(): number {
        return this.maintenances.reduce((s, m) => s + (m.cout || 0), 0)
    }

    getThisMonthCount(): number {
        const now = new Date()
        return this.maintenances.filter(m => {
            const raw = (m as any).dateMaintenance
            if (!raw) return false
            const d = new Date(raw)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length
    }

}
