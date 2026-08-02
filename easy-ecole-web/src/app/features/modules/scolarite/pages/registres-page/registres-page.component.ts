import { Component, OnInit } from '@angular/core';
import { RegistreAcademiqueService } from 'src/app/data/modules/scolarite/services/registre-academique.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { DeliberationService } from 'src/app/features/modules/bulletins/services/deliberation.service';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';

interface GenerationRecap {
  crees: number;
  maj: number;
  total: number;
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
  selectedDecision: string = ''
  searchText: string = ''
  anneeScolaireList: string[] = []
  filiereList: string[] = []
  classeList: string[] = []
  decisionList: string[] = ['Admis', 'Redouble']

  // Dossier view
  registres: any[] = []
  dossierNodes: DossierNode[] = []
  dossierColumns: DossierColumn[] = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'moyenne', label: 'Moyenne' },
    { key: 'rang', label: 'Rang' },
    { key: 'decision', label: 'Décision' }
  ]
  batchActions: BatchAction[] = [
    { label: 'Marquer Admis', color: 'green', action: 'admis' },
    { label: 'Marquer Redouble', color: 'red', action: 'redouble' }
  ]

  // Génération depuis une délibération
  showGeneratePanel: boolean = false
  deliberations: any[] = []
  selectedDeliberationId: number | null = null
  generating: boolean = false
  generationResult: GenerationRecap | null = null

  // Pagination
  currentPage: number = 1
  totalPages: number = 1
  totalItems: number = 0
  pageSize: number = 20

  constructor(
    private registreService: RegistreAcademiqueService,
    private deliberationService: DeliberationService,
    private toastService: ToastService
  ) {
    super()
    this.loadRegistres()
  }

  ngOnInit(): void {
  }

  getDecisionCount(decision: string): number {
    return this.registres.filter((r: any) => r.decision === decision).length
  }

  onFilterChange(): void {
    this.currentPage = 1
    this.loadRegistres()
  }

  onSearch(): void {
    this.currentPage = 1
    this.loadRegistres()
  }

  onPageChange(page: number): void {
    this.currentPage = page
    this.loadRegistres()
  }

  loadRegistres(): void {
    this.loading = true
    this.errorMessage = ''

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    }

    if (this.selectedAnneeScolaire) params.anneeScolaire = this.selectedAnneeScolaire
    if (this.selectedFiliere) params.filiere = this.selectedFiliere
    if (this.selectedClasse) params.classe = this.selectedClasse
    if (this.selectedDecision) params.decision = this.selectedDecision
    if (this.searchText) params.search = this.searchText

    this.registreService.getAll(params).subscribe({
      next: (res: any) => {
        const data = res.data || res
        this.registres = Array.isArray(data) ? data : []
        if (res.pagination) {
          this.totalItems = res.pagination.total || 0
          this.totalPages = res.pagination.totalPages || 1
          this.currentPage = res.pagination.page || 1
        } else {
          this.totalItems = this.registres.length
          this.totalPages = 1
        }

        this.buildFilterLists()
        this.buildDossierTree()
        this.loading = false
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des registres'
        this.loading = false
      }
    })
  }

  buildFilterLists(): void {
    this.anneeScolaireList = [...new Set(this.registres.map(r => r.anneeScolaire))].sort()
    this.filiereList = [...new Set(this.registres.map(r => r.filiere).filter((f: string) => !!f && String(f).trim() !== ''))].sort()
    this.classeList = [...new Set(this.registres.map(r => r.classe))].sort()
  }

  buildDossierTree(): void {
    const anneeMap = new Map<string, DossierNode>()
    const hasFiliere = this.registres.some(r => r.filiere && String(r.filiere).trim() !== '')

    for (const r of this.registres) {
      const annee = r.anneeScolaire || 'Inconnue'
      const classe = r.classe || 'Inconnue'

      if (!anneeMap.has(annee)) {
        anneeMap.set(annee, { type: 'annee', label: annee, id: annee, children: [], expanded: true })
      }
      const anneeNode = anneeMap.get(annee)!

      // Niveau intermédiaire Filière (Année → Filière → Classe → étudiants)
      // avec repli sur Année → Classe si aucune donnée ne contient de filière.
      let classeContainer: DossierNode[] = anneeNode.children!
      if (hasFiliere) {
        const filiere = r.filiere && String(r.filiere).trim() !== '' ? String(r.filiere).trim() : 'Sans filière'
        const filiereKey = `${annee}_filiere_${filiere}`
        let filiereNode = anneeNode.children!.find(c => c.id === filiereKey)
        if (!filiereNode) {
          filiereNode = { type: 'niveau', label: filiere, id: filiereKey, children: [], expanded: true }
          anneeNode.children!.push(filiereNode)
        }
        classeContainer = filiereNode.children!
      }

      const classeKey = `${annee}_${hasFiliere ? 'filiere_' : ''}${classe}`
      let classeNode = classeContainer.find(c => c.id === classeKey)
      if (!classeNode) {
        classeNode = { type: 'parcours', label: classe, id: classeKey, children: [], expanded: true }
        classeContainer.push(classeNode)
      }

      classeNode.items = classeNode.items || []
      classeNode.items.push({
        id: r.id,
        etudiant: r.etudiant,
        matricule: r.matricule,
        moyenne: r.moyenne,
        rang: r.rang,
        decision: r.decision,
        _registre: r
      })
    }

    this.dossierNodes = Array.from(anneeMap.values())
  }

  onBatchAction(ev: { action: string, ids: number[] }): void {
    const decision = ev.action === 'admis' ? 'Admis' : 'Redouble'
    this.registreService.batchStatut(ev.ids, decision).subscribe({
      next: () => {
        this.loadRegistres()
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour'
      }
    })
  }

  onItemAction(ev: { item: any, action: string }): void {
    // Single item action: toggle decision
    const currentDecision = ev.item.decision
    const newDecision = currentDecision === 'Admis' ? 'Redouble' : 'Admis'
    this.registreService.batchStatut([ev.item.id], newDecision).subscribe({
      next: () => {
        this.loadRegistres()
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour'
      }
    })
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
        this.loadRegistres()
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
    this.selectedDecision = ''
    this.searchText = ''
    this.currentPage = 1
    this.loadRegistres()
  }
}
