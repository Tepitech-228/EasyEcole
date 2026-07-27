import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SortieProvisoire } from 'src/app/data/modules/immobilisations/models/SortieProvisoire.model';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { SortieProvisoireService } from 'src/app/data/modules/immobilisations/services/sortie-provisoire.service';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';

@Component({
    selector: 'app-liste-sorties-provisoires-page',
    templateUrl: './liste-sorties-provisoires-page.component.html',
    styleUrls: ['./liste-sorties-provisoires-page.component.scss']
})
export class ListeSortiesProvisoiresPageComponent extends BaseComponentClass implements OnInit {

    sorties: SortieProvisoire[] = []
    immobilisations: Immobilisation[] = []
    loading = false
    showForm = false
    form: FormGroup

    constructor(
        private sortieProvisoireService: SortieProvisoireService,
        private immobilisationService: ImmobilisationService,
        private fb: FormBuilder) {
        super()
        this.form = this.fb.group({
            immobilisationId: ['', Validators.required],
            motif: ['', Validators.required],
            dateSortie: ['', Validators.required],
            dateRetourPrevue: [''],
            notes: ['']
        })
    }

    ngOnInit(): void {
        this.loadSorties()
        this.loadImmobilisations()
    }

    loadSorties(): void {
        this.loading = true
        this.sortieProvisoireService.getAll()
            .subscribe({
                next: (res) => {
                    this.sorties = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    loadImmobilisations(): void {
        this.immobilisationService.getAll()
            .subscribe({ next: (res) => this.immobilisations = res, error: () => { } })
    }

    get totalSorties(): number {
        return this.sorties.length
    }

    get enCoursCount(): number {
        return this.sorties.filter(s => s.statut === 'En cours' || !s.statut).length
    }

    get retourneesCount(): number {
        return this.sorties.filter(s => s.statut === 'Retourné').length
    }

    toggleForm(): void {
        this.showForm = !this.showForm
        if (!this.showForm) this.form.reset()
    }

    submit(): void {
        if (this.form.invalid) return
        const data = { ...this.form.value, statut: 'En cours' }
        this.sortieProvisoireService.create(data)
            .subscribe({
                next: () => {
                    this.loadSorties()
                    this.showForm = false
                    this.form.reset()
                },
                error: () => { }
            })
    }

    marquerRetourne(item: SortieProvisoire): void {
        if (!confirm('Marquer cette sortie comme retournée ?')) return
        const updated: SortieProvisoire = {
            ...item,
            dateRetourEffective: new Date().toISOString(),
            statut: 'Retourné'
        }
        this.sortieProvisoireService.update(updated)
            .subscribe({ next: () => this.loadSorties(), error: () => { } })
    }

    supprimer(id?: string): void {
        if (!id || !confirm('Supprimer cette sortie ?')) return
        this.sortieProvisoireService.delete(id)
            .subscribe({ next: () => this.loadSorties(), error: () => { } })
    }

    statutBadge(statut: string): string {
        const map: Record<string, string> = {
            'En cours': 'bg-yellow-100 text-yellow-700',
            'Retourné': 'bg-green-100 text-green-700'
        }
        return map[statut] || 'bg-gray-100 text-gray-700'
    }

    immobilisationNom(id?: string): string {
        const immo = this.immobilisations.find(i => i.id === id)
        return immo ? immo.nom || immo.reference || id! : id || '---'
    }
}
