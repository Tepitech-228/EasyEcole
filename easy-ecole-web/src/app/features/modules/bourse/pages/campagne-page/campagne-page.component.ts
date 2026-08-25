import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BourseService } from 'src/app/data/modules/bourse/services/bourse.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-campagne-page',
  templateUrl: './campagne-page.component.html',
  styleUrls: ['./campagne-page.component.scss']
})
export class CampagnePageComponent extends BaseComponentClass implements OnInit {

  // ── Étape wizard ──
  currentStep: number = 1

  // ── Étape 1 : Paramètres ──
  configurations: any[] = []
  selectedConfigId: number | null = null
  useNewConfig: boolean = false
  newConfig: any = { nom: '', type: 'PARTIELLE', taux: 50, description: '' }
  dateDebut: string = ''
  dateFin: string = ''
  motif: string = ''

  // ── Étape 2 : Sélection ──
  etudiants: any[] = []
  selectedIds: Set<number> = new Set()
  loadingEtudiants: boolean = false
  searchTerm: string = ''
  filterBoursiers: string = '' // '', 'true', 'false'
  filterSansBourse: string = ''
  selectAll: boolean = false

  // ── Étape 3 : Confirmation ──
  submitting: boolean = false
  result: any = null

  constructor(
    private bourseService: BourseService,
    private toastService: ToastService,
  ) { super(); }

  ngOnInit(): void {
    this.loadConfigurations()
  }

  // ════════════════════════════════════════
  // ÉTAPE 1 : Paramètres
  // ════════════════════════════════════════

  loadConfigurations(): void {
    this.bourseService.getConfigurations().subscribe({
      next: (res) => {
        this.configurations = (Array.isArray(res) ? res : []).filter((c: any) => c.statut === 'ACTIVE')
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des configurations')
      }
    })
  }

  onTypeChange(): void {
    if (this.newConfig.type === 'TOTAL') {
      this.newConfig.taux = 100
    }
  }

  get selectedConfig(): any {
    if (this.useNewConfig) return null
    return this.configurations.find(c => c.id === this.selectedConfigId) || null
  }

  get configTaux(): number {
    if (this.useNewConfig) return this.newConfig.type === 'TOTAL' ? 100 : (this.newConfig.taux || 0)
    return this.selectedConfig?.taux || 0
  }

  get configType(): string {
    if (this.useNewConfig) return this.newConfig.type
    return this.selectedConfig?.type || ''
  }

  step1Valid(): boolean {
    if (this.useNewConfig) {
      if (!this.newConfig.nom?.trim()) return false
      if (this.newConfig.type === 'PARTIELLE') {
        const t = parseFloat(this.newConfig.taux)
        if (isNaN(t) || t <= 0 || t >= 100) return false
      }
    } else {
      if (!this.selectedConfigId) return false
    }
    if (!this.dateDebut) return false
    return true
  }

  goToStep2(): void {
    if (!this.step1Valid()) return
    this.currentStep = 2
    this.loadEtudiants()
  }

  // ════════════════════════════════════════
  // ÉTAPE 2 : Sélection des étudiants
  // ════════════════════════════════════════

  loadEtudiants(): void {
    this.loadingEtudiants = true
    this.bourseService.getEtudiantsEligibles({
      search: this.searchTerm || undefined,
      estBoursier: this.filterBoursiers || undefined,
      sansBourse: this.filterSansBourse || undefined,
    }).subscribe({
      next: (res) => {
        this.etudiants = res?.etudiants || []
        // Pré-sélectionner ceux qui ont déclaré estBoursier et n'ont pas de bourse active
        this.etudiants.forEach(e => {
          if (e.estBoursierDeclare && !e.bourseActive) {
            this.selectedIds.add(e.dossierId)
          }
        })
        this.updateSelectAll()
        this.loadingEtudiants = false
      },
      error: () => {
        this.loadingEtudiants = false
        this.toastService.error('Erreur lors du chargement des étudiants')
      }
    })
  }

  get filteredEtudiants(): any[] {
    return this.etudiants
  }

  toggleSelection(dossierId: number): void {
    if (this.selectedIds.has(dossierId)) {
      this.selectedIds.delete(dossierId)
    } else {
      this.selectedIds.add(dossierId)
    }
    this.updateSelectAll()
  }

  isSelected(dossierId: number): boolean {
    return this.selectedIds.has(dossierId)
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      // Désélectionner tous ceux qui ne sont PAS déjà boursiers (on garde les boursiers pré-sélectionnés)
      this.etudiants.forEach(e => {
        if (!e.bourseActive) {
          this.selectedIds.delete(e.dossierId)
        }
      })
      this.selectAll = false
    } else {
      // Sélectionner tous ceux qui n'ont pas déjà une bourse active
      this.etudiants.forEach(e => {
        if (!e.bourseActive) {
          this.selectedIds.add(e.dossierId)
        }
      })
      this.selectAll = true
    }
  }

  private updateSelectAll(): void {
    const selectable = this.etudiants.filter(e => !e.bourseActive)
    this.selectAll = selectable.length > 0 && selectable.every(e => this.selectedIds.has(e.dossierId))
  }

  get selectedCount(): number {
    return this.selectedIds.size
  }

  get selectableCount(): number {
    return this.etudiants.filter(e => !e.bourseActive).length
  }

  goToStep1(): void {
    this.currentStep = 1
  }

  goToStep3(): void {
    if (this.selectedIds.size === 0) {
      this.toastService.error('Sélectionnez au moins un étudiant')
      return
    }
    this.currentStep = 3
  }

  // ════════════════════════════════════════
  // ÉTAPE 3 : Confirmation
  // ════════════════════════════════════════

  get selectedEtudiants(): any[] {
    return this.etudiants.filter(e => this.selectedIds.has(e.dossierId))
  }

  get configLabel(): string {
    if (this.useNewConfig) {
      return `${this.newConfig.nom} — ${this.newConfig.taux}% (${this.newConfig.type === 'TOTAL' ? 'Totale' : 'Partielle'})`
    }
    return `${this.selectedConfig?.nom} — ${this.selectedConfig?.taux}% (${this.selectedConfig?.type === 'TOTAL' ? 'Totale' : 'Partielle'})`
  }

  confirmer(): void {
    this.submitting = true
    this.result = null

    const payload: any = {
      dateDebut: this.dateDebut,
      dateFin: this.dateFin || null,
      motif: this.motif || null,
      dossierIds: Array.from(this.selectedIds),
    }

    if (this.useNewConfig) {
      payload.configData = {
        nom: this.newConfig.nom.trim(),
        type: this.newConfig.type,
        taux: parseFloat(this.newConfig.taux),
        description: this.newConfig.description || null,
      }
    } else {
      payload.configurationId = this.selectedConfigId
    }

    this.bourseService.bulkAttribuer(payload).subscribe({
      next: (res) => {
        this.submitting = false
        this.result = res
        if (res.created > 0) {
          this.toastService.success(`${res.created} bourse(s) attribuée(s) avec succès`)
        }
        if (res.skipped > 0) {
          this.toastService.success(`${res.skipped} étudiant(s) ignoré(s) (bourse active existante)`)
        }
      },
      error: (err) => {
        this.submitting = false
        this.toastService.error(err.error?.message || 'Erreur lors de l\'attribution en masse')
      }
    })
  }

  recommencer(): void {
    this.currentStep = 1
    this.selectedConfigId = null
    this.useNewConfig = false
    this.newConfig = { nom: '', type: 'PARTIELLE', taux: 50, description: '' }
    this.dateDebut = ''
    this.dateFin = ''
    this.motif = ''
    this.etudiants = []
    this.selectedIds.clear()
    this.selectAll = false
    this.result = null
    this.searchTerm = ''
    this.filterBoursiers = ''
    this.filterSansBourse = ''
  }

  formatMontant(m: number): string {
    return (m || 0).toLocaleString('fr-FR') + ' FCFA'
  }
}
