import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AffectationImmobilisation } from 'src/app/data/modules/immobilisations/models/AffectationImmobilisation.model';
import { Immobilisation } from 'src/app/data/modules/immobilisations/models/Immobilisation.model';
import { AffectationService } from 'src/app/data/modules/immobilisations/services/affectation.service';
import { ImmobilisationService } from 'src/app/data/modules/immobilisations/services/immobilisation.service';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';

@Component({
    selector: 'app-liste-affectations-page',
    templateUrl: './liste-affectations-page.component.html',
    styleUrls: ['./liste-affectations-page.component.scss']
})
export class ListeAffectationsPageComponent extends BaseComponentClass implements OnInit {

    affectations: AffectationImmobilisation[] = []
    immobilisations: Immobilisation[] = []
    employes: any[] = []
    loading = false
    showForm = false
    form: FormGroup

    constructor(
        private affectationService: AffectationService,
        private immobilisationService: ImmobilisationService,
        private rhEmployeService: RhEmployeService,
        private fb: FormBuilder) {
        super()
        this.form = this.fb.group({
            immobilisationId: ['', Validators.required],
            employeId: ['', Validators.required],
            dateAffectation: ['', Validators.required],
            notes: ['']
        })
    }

    ngOnInit(): void {
        this.loadAffectations()
        this.loadImmobilisations()
        this.loadEmployes()
    }

    loadAffectations(): void {
        this.loading = true
        this.affectationService.getAll()
            .subscribe({
                next: (res) => {
                    this.affectations = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    loadImmobilisations(): void {
        this.immobilisationService.getAll()
            .subscribe({ next: (res) => this.immobilisations = res, error: () => { } })
    }

    loadEmployes(): void {
        this.rhEmployeService.getAll()
            .subscribe({ next: (res) => this.employes = res, error: () => { } })
    }

    get totalAffectations(): number {
        return this.affectations.length
    }

    get enCoursCount(): number {
        return this.affectations.filter(a => a.statut === 'En cours' || !a.statut).length
    }

    get termineesCount(): number {
        return this.affectations.filter(a => a.statut === 'Terminée').length
    }

    toggleForm(): void {
        this.showForm = !this.showForm
        if (!this.showForm) this.form.reset()
    }

    submit(): void {
        if (this.form.invalid) return
        const data = { ...this.form.value, statut: 'En cours' }
        this.affectationService.create(data)
            .subscribe({
                next: () => {
                    this.loadAffectations()
                    this.showForm = false
                    this.form.reset()
                },
                error: () => { }
            })
    }

    terminer(item: AffectationImmobilisation): void {
        if (!confirm('Terminer cette affectation ?')) return
        this.affectationService.update({ ...item, statut: 'Terminée', dateRetour: new Date().toISOString() })
            .subscribe({ next: () => this.loadAffectations(), error: () => { } })
    }

    supprimer(id?: string): void {
        if (!id || !confirm('Supprimer cette affectation ?')) return
        this.affectationService.delete(id)
            .subscribe({ next: () => this.loadAffectations(), error: () => { } })
    }

    statutBadge(statut: string): string {
        const map: Record<string, string> = {
            'En cours': 'bg-blue-100 text-blue-700',
            'Terminée': 'bg-green-100 text-green-700'
        }
        return map[statut] || 'bg-gray-100 text-gray-700'
    }

    immobilisationNom(id?: string): string {
        const immo = this.immobilisations.find(i => i.id === id)
        return immo ? immo.nom || immo.reference || id! : id || '---'
    }

    employeNom(id?: string): string {
        const emp = this.employes.find(e => e.id === id)
        return emp ? emp.nom || emp.prenom || id! : id || '---'
    }
}
