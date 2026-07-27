import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RebutImmobilisation } from 'src/app/data/modules/immobilisations/models/RebutImmobilisation.model';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { RebutImmobilisationService } from 'src/app/data/modules/immobilisations/services/rebut-immobilisation.service';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';

@Component({
    selector: 'app-liste-rebuts-immo-page',
    templateUrl: './liste-rebuts-immo-page.component.html',
    styleUrls: ['./liste-rebuts-immo-page.component.scss']
})
export class ListeRebutsImmoPageComponent extends BaseComponentClass implements OnInit {

    rebuts: RebutImmobilisation[] = []
    immobilisations: Immobilisation[] = []
    loading = false
    showForm = false
    form: FormGroup

    constructor(
        private rebutService: RebutImmobilisationService,
        private immobilisationService: ImmobilisationService,
        private fb: FormBuilder) {
        super()
        this.form = this.fb.group({
            immobilisationId: ['', Validators.required],
            dateRebut: ['', Validators.required],
            motif: ['', Validators.required],
            montant: [0],
        })
    }

    ngOnInit(): void {
        this.loadRebuts()
        this.loadImmobilisations()
    }

    loadRebuts(): void {
        this.loading = true
        this.rebutService.getAll()
            .subscribe({
                next: (res) => {
                    this.rebuts = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    loadImmobilisations(): void {
        this.immobilisationService.getAll()
            .subscribe({
                next: (res) => this.immobilisations = res,
                error: () => { }
            })
    }

    get totalRebuts(): number {
        return this.rebuts.length
    }

    get totalMontant(): number {
        return this.rebuts.reduce((s, r) => s + (r.montant || 0), 0)
    }

    toggleForm(): void {
        this.showForm = !this.showForm
        if (!this.showForm) this.form.reset({ montant: 0 })
    }

    submit(): void {
        if (this.form.invalid) return
        this.rebutService.create(this.form.value)
            .subscribe({
                next: () => {
                    this.loadRebuts()
                    this.showForm = false
                    this.form.reset({ montant: 0 })
                },
                error: () => { }
            })
    }

    supprimer(id?: string): void {
        if (!id || !confirm('Supprimer ce rebut ?')) return
        this.rebutService.delete(id)
            .subscribe({ next: () => this.loadRebuts(), error: () => { } })
    }

    immobilisationNom(id?: string): string {
        const immo = this.immobilisations.find(i => i.id === id)
        return immo ? immo.nom || immo.reference || id! : id || '---'
    }
}
