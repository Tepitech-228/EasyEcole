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
  dateDebut: string = ''
  dateFin: string = ''
  motif: string = ''

  // ── Étape 2 : Choix du niveau ──
  niveaux: any[] = []
  selectedNiveauId: number | null = null
  loadingNiveaux: boolean = false
  etudiants: any[] = []
  loadingEtudiants: boolean = false
  searchTerm: string = ''
  filterBoursiers: string = ''
  filterSansBourse: string = ''

  // ── Étape 3 : Confirmation ──
  submitting: boolean = false
  result: any = null

  constructor(
    private bourseService: BourseService,
    private toastService: ToastService,
  ) { super(); }

  ngOnInit(): void {
    this.loadConfigurations()
    this.loadNiveaux()
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

  get selectedConfig(): any {
    return this.configurations.find(c => c.id === this.selectedConfigId) || null
  }

  get configTaux(): number {
    return this.selectedConfig?.taux || 0
  }

  get configType(): string {
    return this.selectedConfig?.type || ''
  }

  step1Valid(): boolean {
    return !!this.selectedConfigId && !!this.dateDebut
  }

  goToStep2(): void {
    if (!this.step1Valid()) return
    this.currentStep = 2
  }

  // ════════════════════════════════════════
  // ÉTAPE 2 : Sélection du niveau d'études
  // ════════════════════════════════════════

  loadNiveaux(): void {
    this.loadingNiveaux = true
    this.bourseService.getNiveaux().subscribe({
      next: (res) => {
        this.niveaux = Array.isArray(res) ? res : []
        this.loadingNiveaux = false
      },
      error: () => {
        this.loadingNiveaux = false
        this.toastService.error('Erreur lors du chargement des niveaux d\'études')
      }
    })
  }

  selectNiveau(niveauId: number): void {
    this.selectedNiveauId = niveauId
    this.etudiants = []
    this.loadEtudiants()
  }

  get selectedNiveau(): any {
    return this.niveaux.find(n => n.id === this.selectedNiveauId) || null
  }

  loadEtudiants(): void {
    if (!this.selectedNiveauId) return
    this.loadingEtudiants = true
    this.bourseService.getEtudiantsByNiveau(this.selectedNiveauId, {
      search: this.searchTerm || undefined,
      estBoursier: this.filterBoursiers || undefined,
      sansBourse: this.filterSansBourse || undefined,
    }).subscribe({
      next: (res) => {
        this.etudiants = res?.etudiants || []
        this.loadingEtudiants = false
      },
      error: () => {
        this.loadingEtudiants = false
        this.toastService.error('Erreur lors du chargement des étudiants')
      }
    })
  }

  get totalEtudiantsNiveau(): number {
    return this.selectedNiveau?.totalEtudiants || 0
  }

  get sansBourseNiveau(): number {
    return this.selectedNiveau?.sansBourse || 0
  }

  goToStep1(): void {
    this.currentStep = 1
  }

  goToStep3(): void {
    if (!this.selectedNiveauId) {
      this.toastService.error('Sélectionnez un niveau d\'études')
      return
    }
    this.currentStep = 3
  }

  // ════════════════════════════════════════
  // ÉTAPE 3 : Confirmation
  // ════════════════════════════════════════

  get configLabel(): string {
    return `${this.selectedConfig?.nom} — ${this.selectedConfig?.taux}% (${this.selectedConfig?.type === 'TOTAL' ? 'Totale' : 'Partielle'})`
  }

  confirmer(): void {
    if (!this.selectedNiveauId || !this.selectedConfigId) return
    this.submitting = true
    this.result = null

    this.bourseService.bulkAttribuer({
      configurationId: this.selectedConfigId,
      niveauEtudeId: this.selectedNiveauId,
      dateDebut: this.dateDebut,
      dateFin: this.dateFin || null,
      motif: this.motif || null,
    }).subscribe({
      next: (res) => {
        this.submitting = false
        this.result = res
        if (res.created > 0) {
          this.toastService.success(`${res.created} bourse(s) attribuée(s) avec succès`)
        }
        if (res.skipped > 0) {
          this.toastService.success(`${res.skipped} etudiant(s) ignore(s) (bourse active existante)`)
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
    this.dateDebut = ''
    this.dateFin = ''
    this.motif = ''
    this.selectedNiveauId = null
    this.etudiants = []
    this.searchTerm = ''
    this.filterBoursiers = ''
    this.filterSansBourse = ''
    this.result = null
    this.loadNiveaux()
  }

  formatMontant(m: number): string {
    return (m || 0).toLocaleString('fr-FR') + ' FCFA'
  }
}
