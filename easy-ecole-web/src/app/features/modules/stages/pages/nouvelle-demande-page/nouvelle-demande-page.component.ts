import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { OffreStageService } from 'src/app/data/modules/stages/services/offre-stage.service';
import { DemandeStageService } from 'src/app/data/modules/stages/services/demande-stage.service';
import { OffreStage } from 'src/app/data/modules/stages/models/OffreStage.model';
import { DemandeStage } from 'src/app/data/modules/stages/models/DemandeStage.model';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';

@Component({
    selector: 'app-nouvelle-demande-page',
    templateUrl: './nouvelle-demande-page.component.html',
    styleUrls: ['./nouvelle-demande-page.component.scss']
})
export class NouvelleDemandePageComponent extends BaseComponentClass implements OnInit {
    error: boolean = false
    disableButton: boolean = false
    alreadyExists: boolean = false
    offres: OffreStage[] = []
    apprenantId: string = ''
    loadingOffres: boolean = false

    form: FormGroup = new FormGroup({
        offreStageId: new FormControl(null, [Validators.required]),
        dateDebut: new FormControl(null, [Validators.required]),
        dateFin: new FormControl(null, [Validators.required]),
        nouvelleEntreprise: new FormControl(null, []),
    })

    constructor(
        private router: Router,
        private offreStageService: OffreStageService,
        private demandeStageService: DemandeStageService,
        private utilisateurService: UtilisateurService
    ) {
        super()
        if (!this.rolesValue.isApprenant && !this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
            this.router.navigate(['/stages/demandes'])
        }
    }

    ngOnInit(): void {
        this.loadOffres()
        this.loadApprenantId()
    }

    loadOffres(): void {
        this.loadingOffres = true
        this.offreStageService.getAll().subscribe({
            next: (res) => { this.offres = res.filter((o: OffreStage) => o.statut === 'ouvert') },
            error: () => { this.loadingOffres = false },
            complete: () => { this.loadingOffres = false }
        })
    }

    loadApprenantId(): void {
        const userId = BaseComponentClass.utilisateur.id
        if (!userId) return
        this.utilisateurService.get(String(userId)).subscribe({
            next: (res: any) => {
                this.apprenantId = res?.apprenant?.id || ''
            },
            error: () => {}
        })
    }

    create(): void {
        this.form.markAllAsTouched()
        if (this.form.valid && this.apprenantId) {
            const demande = new DemandeStage()
            demande.offreStageId = this.form.get('offreStageId')!.value
            demande.apprenantId = this.apprenantId
            demande.dateDebut = this.form.get('dateDebut')!.value
            demande.dateFin = this.form.get('dateFin')!.value
            demande.nouvelleEntreprise = this.form.get('nouvelleEntreprise')!.value || undefined
            demande.statut = 'en_attente'

            this.disableButton = true
            this.demandeStageService.create(demande).subscribe({
                next: () => { this.router.navigateByUrl('/stages/demandes') },
                error: (err: HttpErrorResponse) => {
                    this.alreadyExists = err.error?.alreadyExists
                    if (!this.alreadyExists) { this.error = true }
                    setTimeout(() => { this.error = false; this.alreadyExists = false }, 3000)
                },
                complete: () => { this.disableButton = false }
            })
        }
    }
}
