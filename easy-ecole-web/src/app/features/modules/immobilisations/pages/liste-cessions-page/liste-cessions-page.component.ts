import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Cession } from 'src/app/data/modules/immobilisations/models/Cession.model';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { CessionService } from 'src/app/data/modules/immobilisations/services/cession.service';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';

@Component({
    selector: 'app-liste-cessions-page',
    templateUrl: './liste-cessions-page.component.html',
    styleUrls: ['./liste-cessions-page.component.scss']
})
export class ListeCessionsPageComponent extends BaseComponentClass implements OnInit {

    cessions: Cession[] = []
    immobilisations: Immobilisation[] = []
    loading = false
    showForm = false
    form: FormGroup

    constructor(
        private cessionService: CessionService,
        private immobilisationService: ImmobilisationService,
        private fb: FormBuilder) {
        super()
        this.form = this.fb.group({
            immobilisationId: ['', Validators.required],
            typeOperation: ['cession'],
            dateCession: ['', Validators.required],
            prixCession: [0],
            motif: [''],
            destinataire: ['']
        })
    }

    ngOnInit(): void {
        this.loadCessions()
        this.loadImmobilisations()
    }

    loadCessions(): void {
        this.loading = true
        this.cessionService.getAll()
            .subscribe({
                next: (res) => {
                    this.cessions = res
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

    get totalCessions(): number {
        return this.cessions.length
    }

    get totalMontant(): number {
        return this.cessions.reduce((s, c) => s + (c.prixCession || 0), 0)
    }

    get enAttenteCount(): number {
        return this.cessions.filter(c => !c.approuvePar && !c.motifRefus).length
    }

    toggleForm(): void {
        this.showForm = !this.showForm
        if (!this.showForm) this.form.reset({ typeOperation: 'cession', prixCession: 0 })
    }

    submit(): void {
        if (this.form.invalid) return
        this.cessionService.create(this.form.value)
            .subscribe({
                next: () => {
                    this.loadCessions()
                    this.showForm = false
                    this.form.reset({ typeOperation: 'cession', prixCession: 0 })
                },
                error: () => { }
            })
    }

    approuver(id?: string): void {
        if (!id) return
        this.cessionService.approuver(id)
            .subscribe({ next: () => this.loadCessions(), error: () => { } })
    }

    refuser(id?: string): void {
        if (!id) return
        const motif = prompt('Motif du refus:')
        if (motif === null) return
        this.cessionService.refuser(id, motif)
            .subscribe({ next: () => this.loadCessions(), error: () => { } })
    }

    supprimer(id?: string): void {
        if (!id || !confirm('Supprimer cette cession ?')) return
        this.cessionService.delete(id)
            .subscribe({ next: () => this.loadCessions(), error: () => { } })
    }

    statutBadge(cession: Cession): string {
        if (cession.approuvePar) return 'bg-green-100 text-green-700'
        if (cession.motifRefus) return 'bg-red-100 text-red-700'
        return 'bg-orange-100 text-orange-700'
    }

    statutLabel(cession: Cession): string {
        if (cession.approuvePar) return 'Approuvé'
        if (cession.motifRefus) return 'Refusé'
        return 'En attente'
    }

    immobilisationNom(id?: string): string {
        const immo = this.immobilisations.find(i => i.id === id)
        return immo ? immo.nom || immo.reference || id! : id || '---'
    }
}
