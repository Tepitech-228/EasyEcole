import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PlanningPersonnelService, PlanningPersonnel } from 'src/app/data/modules/rh/services/planning-personnel.service';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { JoursSemaine } from 'src/app/data/enums/JoursSemaine';

@Component({
  selector: 'app-planning-personnel-page',
  templateUrl: './planning-personnel-page.component.html',
  styleUrls: ['./planning-personnel-page.component.scss']
})
export class PlanningPersonnelPageComponent extends BaseComponentClass implements OnInit {
  plannings: PlanningPersonnel[] = []
  employes: any[] = []
  loading: boolean = false
  showModal: boolean = false
  editMode: boolean = false
  selectedPlanning: PlanningPersonnel | null = null

  joursSemaineList = [
    { value: JoursSemaine.LUNDI, label: 'Lundi' },
    { value: JoursSemaine.MARDI, label: 'Mardi' },
    { value: JoursSemaine.MERCREDI, label: 'Mercredi' },
    { value: JoursSemaine.JEUDI, label: 'Jeudi' },
    { value: JoursSemaine.VENDREDI, label: 'Vendredi' },
    { value: JoursSemaine.SAMEDI, label: 'Samedi' },
  ]

  form: FormGroup = new FormGroup({
    employeId: new FormControl(null, [Validators.required]),
    jourSemaine: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    tache: new FormControl(null, [Validators.required]),
    couleur: new FormControl('#3b82f6', []),
    dateDebut: new FormControl(null, [Validators.required]),
    dateFin: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor(
    private planningService: PlanningPersonnelService,
    private employeService: RhEmployeService
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadPlannings()
    this.loadEmployes()
  }

  loadPlannings(): void {
    this.loading = true
    this.planningService.getAll().subscribe({
      next: (data) => { this.plannings = data; this.loading = false },
      error: () => { this.loading = false }
    })
  }

  loadEmployes(): void {
    this.employeService.getAll().subscribe({
      next: (data) => { this.employes = data }
    })
  }

  openNouveau(): void {
    this.editMode = false
    this.selectedPlanning = null
    this.form.reset()
    this.form.get('couleur')!.setValue('#3b82f6')
    this.showModal = true
  }

  openEdition(planning: PlanningPersonnel): void {
    this.editMode = true
    this.selectedPlanning = planning
    this.form.patchValue(planning)
    this.showModal = true
  }

  closeModal(): void {
    this.showModal = false
    this.form.reset()
  }

  save(): void {
    if (!this.form.valid) return
    const data = this.form.value
    if (this.editMode && this.selectedPlanning) {
      data.id = this.selectedPlanning.id
      this.planningService.update(data).subscribe({
        next: () => { this.loadPlannings(); this.closeModal() }
      })
    } else {
      this.planningService.create(data).subscribe({
        next: () => { this.loadPlannings(); this.closeModal() }
      })
    }
  }

  supprimer(id: string): void {
    if (confirm('Supprimer cette entrée de planning ?')) {
      this.planningService.delete(id).subscribe({
        next: () => this.loadPlannings()
      })
    }
  }

  getEmployeName(employe: any): string {
    return employe?.utilisateur?.nom + ' ' + employe?.utilisateur?.prenoms || '—'
  }
}
