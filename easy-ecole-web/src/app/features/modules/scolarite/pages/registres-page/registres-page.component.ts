import { Component, OnInit } from '@angular/core';
import { RegistreAcademiqueService, RegistreAcademiqueQuery } from 'src/app/data/modules/scolarite/services/registre-academique.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { DeliberationService } from 'src/app/features/modules/bulletins/services/deliberation.service';

interface GenerationRecap {
  crees: number;
  maj: number;
  total: number;
}

interface EtudiantPalmares {
  id: number;
  etudiant: string;
  matricule: string;
  classe: string;
  moyenne: number;
  rang: number;
  decision: string;
}

interface PromotionPalmares {
  promotion: string;
  anneeScolaire: string;
  filiere: string;
  niveau: string;
  classe: string;
  totalPromotion: number;
  etudiants: EtudiantPalmares[];
}

@Component({
  selector: 'app-registres-page',
  templateUrl: './registres-page.component.html',
  styleUrls: ['./registres-page.component.scss']
})
export class RegistresPageComponent extends BaseComponentClass implements OnInit {

  loading: boolean = false
  errorMessage: string = ''

  // Filters
  selectedAnneeScolaire: string = ''
  selectedFiliere: string = ''
  selectedClasse: string = ''
  searchText: string = ''
  anneeScolaireList: string[] = []
  filiereList: string[] = []
  classeList: string[] = []

  // Top N (palmarès)
  topN: number = 50
  topNOptions: number[] = [10, 25, 50, 100]

  // Classement par promotion
  promotions: PromotionPalmares[] = []

  // Génération depuis une délibération
  showGeneratePanel: boolean = false
  deliberations: any[] = []
  selectedDeliberationId: number | null = null
  generating: boolean = false
  generationResult: GenerationRecap | null = null

  constructor(
    private registreService: RegistreAcademiqueService,
    private deliberationService: DeliberationService,
    private toastService: ToastService
  ) {
    super()
    this.loadPalmares()
  }

  ngOnInit(): void {
  }

  // ── Agrégats / statistiques ──

  get totalEtudiantsClasses(): number {
    return this.promotions.reduce((total, promo) => total + (promo.etudiants ? promo.etudiants.length : 0), 0)
  }

  get meilleureMoyenne(): number | null {
    let max: number | null = null
    for (const promo of this.promotions) {
      for (const etudiant of (promo.etudiants || [])) {
        const moyenne = Number(etudiant.moyenne)
        if (!isNaN(moyenne) && (max === null || moyenne > max)) {
          max = moyenne
        }
      }
    }
    return max
  }

  getDecisionCount(decision: string): number {
    return this.promotions.reduce((total, promo) =>
      total + (promo.etudiants || []).filter(e => e.decision === decision).length, 0)
  }

  hasActiveFilters(): boolean {
    return !!this.selectedAnneeScolaire || !!this.selectedFiliere || !!this.selectedClasse || !!this.searchText
  }

  // ── Chargement du palmarès ──

  onFilterChange(): void {
    this.loadPalmares()
  }

  onSearch(): void {
    this.loadPalmares()
  }

  onTopNChange(): void {
    this.loadPalmares()
  }

  loadPalmares(): void {
    this.loading = true
    this.errorMessage = ''

    const params: RegistreAcademiqueQuery = { top: this.topN }
    if (this.selectedAnneeScolaire) params.anneeScolaire = this.selectedAnneeScolaire
    if (this.selectedFiliere) params.filiere = this.selectedFiliere
    if (this.selectedClasse) params.classe = this.selectedClasse
    if (this.searchText) params.search = this.searchText

    this.registreService.getTop(params).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res
        this.promotions = Array.isArray(data) ? data : []
        this.buildFilterLists()
        this.loading = false
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement du classement des promotions'
        this.loading = false
      }
    })
  }

  buildFilterLists(): void {
    this.anneeScolaireList = [...new Set(
      this.promotions.map(p => p.anneeScolaire).filter(a => !!a && String(a).trim() !== '')
    )].sort()
    this.filiereList = [...new Set(
      this.promotions.map(p => p.filiere).filter(f => !!f && String(f).trim() !== '')
    )].sort()

    const classes: string[] = []
    for (const promo of this.promotions) {
      if (promo.classe && String(promo.classe).trim() !== '') {
        classes.push(promo.classe)
      }
      for (const etudiant of (promo.etudiants || [])) {
        if (etudiant.classe && String(etudiant.classe).trim() !== '') {
          classes.push(etudiant.classe)
        }
      }
    }
    this.classeList = [...new Set(classes)].sort()
  }

  // ── Helpers d'affichage ──

  formatMoyenne(moyenne: number | null | undefined): string {
    if (moyenne === null || moyenne === undefined || isNaN(Number(moyenne))) return '—'
    return Number(moyenne).toFixed(2)
  }

  rangPillClass(rang: number): string {
    if (rang === 1) return 'rang-1'
    if (rang === 2) return 'rang-2'
    if (rang === 3) return 'rang-3'
    return 'rang-default'
  }

  podiumRowClass(rang: number): string {
    if (rang === 1) return 'podium-row-1'
    if (rang === 2) return 'podium-row-2'
    if (rang === 3) return 'podium-row-3'
    return ''
  }

  decisionBadgeColor(decision: string): string {
    if (!decision) return 'gray'
    const d = decision.toLowerCase()
    if (d.includes('admis')) return 'green'
    if (d.includes('redouble') || d === 'redoublement') return 'red'
    return 'blue'
  }

  trackByEtudiant(index: number, etudiant: EtudiantPalmares): number | string {
    return etudiant && etudiant.id ? etudiant.id : index
  }

  // ── Génération depuis une délibération ──

  openGeneratePanel(): void {
    this.showGeneratePanel = true
    this.generationResult = null
    if (this.deliberations.length === 0) {
      this.deliberationService.getAll({ limit: 100 }).subscribe({
        next: (res: any) => {
          const data = res?.data || (Array.isArray(res) ? res : [])
          this.deliberations = (Array.isArray(data) ? data : [])
            .filter((d: any) => d && (d.statut === 'cloturee' || d.statut === 'publiee'))
        },
        error: () => {
          this.toastService.error('Erreur lors du chargement des délibérations')
        }
      })
    }
  }

  getDeliberationLabel(d: any): string {
    const libelle = d?.libelle || `Délibération #${d?.id}`
    const classe = d?.classe?.libelle ? ` — ${d.classe.libelle}` : ''
    const statut = d?.statut ? ` (${d.statut})` : ''
    return `${libelle}${classe}${statut}`
  }

  genererRegistres(): void {
    if (!this.selectedDeliberationId || this.generating) return

    this.generating = true
    this.generationResult = null
    this.registreService.generer(this.selectedDeliberationId).subscribe({
      next: (res: any) => {
        this.generating = false
        const recap: GenerationRecap = {
          crees: res?.crees ?? 0,
          maj: res?.maj ?? 0,
          total: res?.total ?? 0
        }
        this.generationResult = recap
        this.toastService.success(`Registres générés : ${recap.crees} créés, ${recap.maj} mis à jour, ${recap.total} au total`)
        this.showGeneratePanel = false
        this.selectedDeliberationId = null
        this.loadPalmares()
      },
      error: () => {
        this.generating = false
        this.toastService.error('Erreur lors de la génération des registres')
      }
    })
  }

  reinitialiserFiltres(): void {
    this.selectedAnneeScolaire = ''
    this.selectedFiliere = ''
    this.selectedClasse = ''
    this.searchText = ''
    this.topN = 50
    this.loadPalmares()
  }
}