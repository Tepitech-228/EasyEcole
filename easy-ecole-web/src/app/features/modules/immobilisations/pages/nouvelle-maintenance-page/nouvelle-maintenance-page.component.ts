import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { Maintenance } from 'src/app/data/modules/immobilisations/models/Maintenance.model';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';
import { MaintenanceService } from 'src/app/data/modules/immobilisations/services/maintenance.service';

@Component({
    selector: 'app-nouvelle-maintenance-page',
    templateUrl: './nouvelle-maintenance-page.component.html',
    styleUrls: ['./nouvelle-maintenance-page.component.scss']
})
export class NouvelleMaintenancePageComponent extends BaseComponentClass implements OnInit {

    error: boolean = false

    immobilisations: Immobilisation[] = []

    maintenanceForm: FormGroup = new FormGroup({
        immobilisationId: new FormControl(null, [Validators.required]),
        dateMaintenance: new FormControl(null, [Validators.required]),
        type: new FormControl(null, [Validators.required]),
        description: new FormControl(null, []),
        cout: new FormControl(null, [Validators.required]),
        prestataire: new FormControl(null, []),
    })

    constructor(
        private router: Router,
        private maintenanceService: MaintenanceService,
        private immobilisationService: ImmobilisationService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
            this.router.navigate(['/immobilisations/maintenances'])
        }
    }

    ngOnInit(): void {
        this.immobilisationService.getAll().subscribe({
            next: (res) => { this.immobilisations = res },
            error: (err) => { console.log(err) }
        })
    }

    create(): void {
        this.maintenanceForm.markAllAsTouched()
        if (this.maintenanceForm.valid) {
            let maintenance: Maintenance = new Maintenance()
            maintenance.immobilisationId = this.maintenanceForm.get('immobilisationId')!.value
            maintenance.dateMaintenance = this.maintenanceForm.get('dateMaintenance')!.value
            maintenance.type = this.maintenanceForm.get('type')!.value
            maintenance.description = this.maintenanceForm.get('description')!.value
            maintenance.cout = this.maintenanceForm.get('cout')!.value
            maintenance.prestataire = this.maintenanceForm.get('prestataire')!.value

            this.maintenanceService.create(maintenance).subscribe({
                next: (res) => {
                    this.router.navigate(['/immobilisations/maintenances'])
                },
                error: (err: HttpErrorResponse) => {
                    console.log(err)
                    this.error = true
                    setTimeout(() => { this.error = false }, 3000)
                }
            })
        }
    }

}
