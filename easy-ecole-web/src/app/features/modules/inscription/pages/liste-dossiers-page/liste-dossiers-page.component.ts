import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { DossierEtudiant } from 'src/app/data/modules/inscription/models/DossierEtudiant.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { environment } from 'src/environments/environment';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { FilterValue } from 'src/app/shared/components/filters-annee-niveau-parcours/filters-annee-niveau-parcours.component';

@Component({
  selector: 'app-liste-dossiers-page',
  templateUrl: './liste-dossiers-page.component.html',
  styleUrls: ['./liste-dossiers-page.component.scss']
})
export class ListeDossiersPageComponent extends BaseComponentClass implements OnInit {

  dossiers: DossierEtudiant[] = []
  error: boolean = false
  loading: boolean = false

  annees: AnneeAcademique[] = []
  niveaux: NiveauEtude[] = []
  parcoursList: Parcours[] = []
  sessions: Session[] = []

  selectedAnneeId: string = ''
  selectedNiveauId: string = ''
  selectedParcoursId: string = ''
  selectedStatut: string = ''
  searchTerm: string = ''

  niveauxFiltres: NiveauEtude[] = []
  parcoursFiltres: Parcours[] = []

  page: number = 1
  limit: number = 20
  total: number = 0
  totalPages: number = 0

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly DOSSIERS_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.DOSSIERS
  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  readonly columns: DossierColumn[] = [
    { key: 'matricule', label: 'Matricule', width: '120px' },
    { key: 'nom', label: 'Nom & Prénoms' },
    { key: 'statut', label: 'Statut', width: '100px' },
    { key: 'dateCreation', label: 'Date création', width: '120px' },
  ]

  readonly batchActions: BatchAction[] = [
    { label: 'Valider', color: 'green', action: 'valider', icon: 'check_circle' },
    { label: 'Suspendre', color: 'yellow', action: 'suspendre', icon: 'pause_circle' },
    { label: 'Archiver', color: 'red', action: 'archiver', icon: 'archive' },
  ]

  readonly itemActions: BatchAction[] = [
    { label: 'Visualiser', color: 'indigo', action: 'visualiser', icon: 'visibility' },
  ]

  showDetailModal = false
  detailData: any = null
  detailLoading = false

  constructor(
    private dossierEtudiantService: DossierEtudiantService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadAnnees()
    this.loadNiveaux()
    this.loadParcours()
    this.loadSessions()
    this.getDossiers()
  }

  loadAnnees(): void {
    this.anneeAcademiqueService.getAll().subscribe({
      next: (res) => { this.annees = res },
      error: (err) => console.log(err)
    })
  }

  loadNiveaux(): void {
    this.niveauEtudeService.getAll().subscribe({
      next: (res) => { this.niveaux = res },
      error: (err) => console.log(err)
    })
  }

  loadParcours(): void {
    this.parcoursService.getAll().subscribe({
      next: (res) => { this.parcoursList = res },
      error: (err) => console.log(err)
    })
  }

  loadSessions(): void {
    this.sessionService.getAll().subscribe({
      next: (res) => { this.sessions = res },
      error: (err) => console.log(err)
    })
  }

  onFilterChange(filters: FilterValue): void {
    this.selectedAnneeId = filters.anneeId
    this.selectedNiveauId = filters.niveauId
    this.selectedParcoursId = filters.parcoursId
    this.page = 1

    if (this.selectedAnneeId) {
      const niveauIds = new Set<string>()
      this.sessions
        .filter(s => s.anneeAcademiqueId && String(s.anneeAcademiqueId) === String(this.selectedAnneeId))
        .forEach(s => { if (s.niveauEtudeId) niveauIds.add(String(s.niveauEtudeId)) })
      this.niveauxFiltres = niveauIds.size > 0
        ? this.niveaux.filter(n => niveauIds.has(String(n.id!)))
        : this.niveaux
    } else {
      this.niveauxFiltres = []
    }

    if (this.selectedNiveauId) {
      this.parcoursFiltres = this.parcoursList.filter(p =>
        String(p.niveauEtudeId) === String(this.selectedNiveauId)
      )
    } else {
      this.parcoursFiltres = []
    }

    this.getDossiers()
  }

  onStatutChange(): void {
    this.page = 1
    this.getDossiers()
  }

  onSearch(): void {
    this.page = 1
    this.getDossiers()
  }

  onPageChange(page: number): void {
    this.page = page
    this.getDossiers()
  }

  onBatchAction(event: { action: string, ids: number[] }): void {
    const statutMap: any = {
      valider: 'actif',
      suspendre: 'suspendu',
      archiver: 'archive'
    }
    const newStatut = statutMap[event.action]
    if (!newStatut) return

    for (const id of event.ids) {
      this.dossierEtudiantService.update(String(id), { statut: newStatut }).subscribe({
        error: (err) => console.log(err)
      })
    }
    this.getDossiers()
  }

  onItemAction(event: { item: any, action: string }): void {
    if (event.action === 'visualiser') {
      this.visualiserDossier(event.item.id)
    }
  }

  visualiserDossier(id: number): void {
    this.detailLoading = true
    this.showDetailModal = true
    this.dossierEtudiantService.getComplet(String(id)).subscribe({
      next: (data) => {
        this.detailData = data
        this.detailLoading = false
      },
      error: (err) => {
        console.error(err)
        this.detailLoading = false
      }
    })
  }

  closeDetailModal(): void {
    this.showDetailModal = false
    this.detailData = null
  }

  getDossiers(): void {
    this.loading = true
    this.error = false

    const params: any = {
      page: this.page,
      limit: this.limit
    }
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId
    if (this.selectedStatut) params.statut = this.selectedStatut
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim()

    this.dossierEtudiantService.getAllPaginated(params).subscribe({
      next: (res) => {
        this.dossiers = res.data
        this.page = res.pagination.page
        this.limit = res.pagination.limit
        this.total = res.pagination.total
        this.totalPages = res.pagination.totalPages
        this.loading = false
      },
      error: (err) => {
        console.log(err)
        this.error = true
        this.loading = false
      }
    })
  }

  get treeNodes(): DossierNode[] {
    return this.buildTreeNodes()
  }

  private buildTreeNodes(): DossierNode[] {
    const nodes: DossierNode[] = []

    if (!this.selectedAnneeId) {
      nodes.push({
        type: 'annee',
        label: 'Tous les dossiers étudiants',
        expanded: true,
        items: this.dossiers.map(d => this.dossierToItem(d))
      })
    } else if (!this.selectedNiveauId) {
      nodes.push({
        type: 'annee',
        label: this.getAnneeLibelle(this.selectedAnneeId),
        expanded: true,
        children: this.niveauxFiltres.map(n => ({
          type: 'niveau',
          label: n.libelle,
          id: n.id,
          expanded: false,
        }))
      })
    } else if (!this.selectedParcoursId) {
      nodes.push({
        type: 'annee',
        label: this.getAnneeLibelle(this.selectedAnneeId),
        expanded: true,
        children: [{
          type: 'niveau',
          label: this.getNiveauLibelle(this.selectedNiveauId),
          expanded: true,
          children: this.parcoursFiltres.map(p => ({
            type: 'parcours' as const,
            label: p.titre || '',
            id: p.id,
            expanded: false,
          }))
        }]
      })
    } else {
      nodes.push({
        type: 'annee',
        label: this.getAnneeLibelle(this.selectedAnneeId),
        expanded: true,
        children: [{
          type: 'niveau',
          label: this.getNiveauLibelle(this.selectedNiveauId),
          expanded: true,
          children: [{
            type: 'parcours',
            label: this.getParcoursTitre(this.selectedParcoursId),
            expanded: true,
            items: this.dossiers.map(d => this.dossierToItem(d))
          }]
        }]
      })
    }

    return nodes
  }

  private dossierToItem(d: DossierEtudiant): any {
    return {
      id: d.id,
      matricule: d.matricule,
      nom: d.utilisateur ? `${d.utilisateur.nom} ${d.utilisateur.prenoms}` : '-',
      statut: d.statut || 'inactif',
      dateCreation: d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : '-',
      photo: this.getPhotoUrl(d),
    }
  }

  getAnneeLibelle(id: string): string {
    return this.annees.find(a => a.id === id)?.libelle || id
  }

  getNiveauLibelle(id: string): string {
    return this.niveaux.find(n => n.id === id)?.libelle || id
  }

  getParcoursTitre(id: string): string {
    return this.parcoursList.find(p => p.id === id)?.titre || id
  }

  getPhotoUrl(dossier: DossierEtudiant): string {
    if (dossier.utilisateur?.apprenant?.photo) {
      return this.PHOTOS_PATH + dossier.utilisateur.apprenant.photo
    }
    return 'assets/images/blank-profile-picture.png'
  }
}
