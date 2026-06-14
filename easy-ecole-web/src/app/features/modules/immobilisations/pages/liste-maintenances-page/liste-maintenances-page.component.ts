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

    constructor(
        private maintenanceService: MaintenanceService) {
        super()
        this.getMaintenances()
    }

    ngOnInit(): void {
    }

    private getMaintenances(): void {
        this.maintenanceService.getAll()
            .subscribe(
                {
                    next: (res) => {
                        this.maintenances = res
                    },
                    error: (err) => {
                        console.log(err)
                    },
                }
            )
    }

}
