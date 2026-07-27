import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { InventaireImmobilisation } from 'src/app/data/modules/immobilisations/models/InventaireImmobilisation.model';
import { InventaireImmobilisationService } from 'src/app/data/modules/immobilisations/services/inventaire-immobilisation.service';

@Component({
    selector: 'app-liste-inventaires-immo-page',
    templateUrl: './liste-inventaires-immo-page.component.html',
    styleUrls: ['./liste-inventaires-immo-page.component.scss']
})
export class ListeInventairesImmoPageComponent extends BaseComponentClass implements OnInit {

    inventaires: InventaireImmobilisation[] = []
    loading = false
    showForm = false
    form: FormGroup

    constructor(
        private inventaireImmobilisationService: InventaireImmobilisationService,
        private fb: FormBuilder) {
        super()
        this.form = this.fb.group({
            notes: ['']
        })
    }

    ngOnInit(): void {
        this.loadInventaires()
    }

    loadInventaires(): void {
        this.loading = true
        this.inventaireImmobilisationService.getAll()
            .subscribe({
                next: (res) => {
                    this.inventaires = res
                    this.loading = false
                },
                error: () => this.loading = false
            })
    }

    get totalInventaires(): number {
        return this.inventaires.length
    }

    get enCoursCount(): number {
        return this.inventaires.filter(i => i.statut === 'En cours' || i.statut === 'en_cours').length
    }

    get terminesCount(): number {
        return this.inventaires.filter(i => i.statut === 'Terminé' || i.statut === 'terminé' || i.statut === 'termine').length
    }

    toggleForm(): void {
        this.showForm = !this.showForm
        if (!this.showForm) this.form.reset()
    }

    submit(): void {
        const data = { ...this.form.value, statut: 'En cours', dateDebut: new Date().toISOString() }
        this.inventaireImmobilisationService.create(data)
            .subscribe({
                next: () => {
                    this.loadInventaires()
                    this.showForm = false
                    this.form.reset()
                },
                error: () => { }
            })
    }

    terminer(item: InventaireImmobilisation): void {
        if (!confirm('Terminer cet inventaire ?')) return
        this.inventaireImmobilisationService.update({ ...item, statut: 'Terminé', dateFin: new Date().toISOString() })
            .subscribe({ next: () => this.loadInventaires(), error: () => { } })
    }

    supprimer(id?: string): void {
        if (!id || !confirm('Supprimer cet inventaire ?')) return
        this.inventaireImmobilisationService.delete(id)
            .subscribe({ next: () => this.loadInventaires(), error: () => { } })
    }

    statutBadge(statut: string): string {
        const map: Record<string, string> = {
            'En cours': 'bg-yellow-100 text-yellow-700',
            'en_cours': 'bg-yellow-100 text-yellow-700',
            'Terminé': 'bg-green-100 text-green-700',
            'terminé': 'bg-green-100 text-green-700',
            'termine': 'bg-green-100 text-green-700'
        }
        return map[statut] || 'bg-gray-100 text-gray-700'
    }
}
