import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AssuranceImmobilisation } from 'src/app/data/modules/immobilisations/models/AssuranceImmobilisation.model';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { AssuranceService } from 'src/app/data/modules/immobilisations/services/assurance.service';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';

@Component({
    selector: 'app-liste-assurances-page',
    templateUrl: './liste-assurances-page.component.html',
    styleUrls: ['./liste-assurances-page.component.scss']
})
export class ListeAssurancesPageComponent extends BaseComponentClass implements OnInit {

    assurances: AssuranceImmobilisation[] = []
    immobilisations: Immobilisation[] = []
    loading = false
    showForm = false
    form: FormGroup
    statuts = ['Active', 'Expirée', 'Résiliée']

    constructor(
        private assuranceService: AssuranceService,
        private immobilisationService: ImmobilisationService,
        private fb: FormBuilder) {
        super()
        this.form = this.fb.group({
            immobilisationId: ['', Validators.required],
            compagnie: ['', Validators.required],
            police: ['', Validators.required],
            prime: [0, Validators.required],
            couverture: [''],
            dateDebut: [''],
            dateFin: [''],
            statut: ['Active']
        })
    }

    ngOnInit(): void {
        this.loadAssurances()
        this.loadImmobilisations()
    }

    loadAssurances(): void {
        this.loading = true
        this.assuranceService.getAll()
            .subscribe({
                next: (res) => {
                    this.assurances = res
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

    get totalAssurances(): number {
        return this.assurances.length
    }

    get totalPrimes(): number {
        return this.assurances.reduce((s, a) => s + (a.prime || 0), 0)
    }

    get activesCount(): number {
        return this.assurances.filter(a => a.statut === 'Active').length
    }

    toggleForm(): void {
        this.showForm = !this.showForm
        if (!this.showForm) this.form.reset({ prime: 0, statut: 'Active' })
    }

    submit(): void {
        if (this.form.invalid) return
        this.assuranceService.create(this.form.value)
            .subscribe({
                next: () => {
                    this.loadAssurances()
                    this.showForm = false
                    this.form.reset({ prime: 0, statut: 'Active' })
                },
                error: () => { }
            })
    }

    supprimer(id?: string): void {
        if (!id || !confirm('Supprimer cette assurance ?')) return
        this.assuranceService.delete(id)
            .subscribe({ next: () => this.loadAssurances(), error: () => { } })
    }

    statutBadge(statut: string): string {
        const map: Record<string, string> = {
            'Active': 'bg-green-100 text-green-700',
            'Expirée': 'bg-red-100 text-red-700',
            'Résiliée': 'bg-gray-100 text-gray-700'
        }
        return map[statut] || 'bg-gray-100 text-gray-700'
    }

    immobilisationNom(id?: string): string {
        const immo = this.immobilisations.find(i => i.id === id)
        return immo ? immo.nom || immo.reference || id! : id || '---'
    }
}
