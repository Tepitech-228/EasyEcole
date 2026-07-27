import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeOrientation } from 'src/app/data/modules/orientation/models/DemandeOrientation.model';
import { ParcoursChoisi } from 'src/app/data/modules/orientation/models/ParcoursChoisi.model';
import { DemandeOrientationService } from 'src/app/data/modules/orientation/services/demande-orientation.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/orientation/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/orientation/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/orientation/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {

  showModal: boolean = true
  showNouvelleDemandeModal: boolean = false
  selectedDemande?: DemandeOrientation
  demandesOrientation: DemandeOrientation[] = []

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  isAdmin: boolean = false
  loading: boolean = false

  // Filters
  selectedAnneeId: string = ''
  selectedNiveauId: string = ''
  selectedParcoursId: string = ''
  selectedStatut: string = ''
  searchText: string = ''

  // Filter data
  annees: AnneeAcademique[] = []
  niveaux: NiveauEtude[] = []
  parcoursList: Parcours[] = []
  sessions: Session[] = []

  // Dossier view
  dossierNodes: DossierNode[] = []
  dossierColumns: DossierColumn[] = [
    { key: 'dateDemande', label: 'Date' },
    { key: 'statut', label: 'Statut' },
    { key: 'parcours', label: 'Parcours' }
  ]
  batchActions: BatchAction[] = [
    { label: 'Détails', color: 'primary', action: 'details', icon: 'visibility' },
    { label: 'Marquer traité', color: 'green', action: 'marquer_traite' }
  ]

  // Pagination
  currentPage: number = 1
  totalPages: number = 1
  totalItems: number = 0
  pageSize: number = 20

  constructor(
    private router: Router,
    private demandeOrientationService: DemandeOrientationService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService) {
    super()
    this.isAdmin = this.rolesValue.isInstitution || this.rolesValue.isAdmin
    if (this.isAdmin) {
      this.loadFilterData()
    }
    this.getDemandesOrientation()
  }

  ngOnInit(): void {
  }

  loadFilterData(): void {
    this.loading = true
    combineLatest([
      this.anneeAcademiqueService.getAll(),
      this.niveauEtudeService.getAll(),
      this.parcoursService.getAll(),
      this.sessionService.getAll()
    ]).subscribe({
      next: ([annees, niveaux, parcours, sessions]) => {
        this.annees = annees
        this.niveaux = niveaux
        this.parcoursList = parcours
        this.sessions = sessions
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  onFilterChange(filter: any): void {
    this.selectedAnneeId = filter.anneeId || ''
    this.selectedNiveauId = filter.niveauId || ''
    this.selectedParcoursId = filter.parcoursId || ''
    this.currentPage = 1
    this.getDemandesOrientation()
  }

  onStatutChange(): void {
    this.currentPage = 1
    this.getDemandesOrientation()
  }

  onSearch(): void {
    this.currentPage = 1
    this.getDemandesOrientation()
  }

  onPageChange(page: number): void {
    this.currentPage = page
    this.getDemandesOrientation()
  }

  getDemandesOrientation(): void {
    this.loading = true
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    }

    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId
    if (this.selectedStatut) params.statut = this.selectedStatut
    if (this.searchText) params.search = this.searchText

    this.demandeOrientationService.getAll(params)
    .subscribe({
      next: (res) => {
        if (res.data) {
          this.demandesOrientation = res.data
          this.totalItems = res.pagination?.total || 0
          this.totalPages = res.pagination?.totalPages || 1
          this.currentPage = res.pagination?.page || 1
        } else {
          this.demandesOrientation = res
        }
        if (this.isAdmin) {
          this.buildDossierTree()
        }
        this.loading = false
      },
      error: (err) => {
        console.log(err)
        this.loading = false
      }
    })
  }

  buildDossierTree(): void {
    const anneeMap = new Map<string, DossierNode>()
    const niveauMap = new Map<string, DossierNode>()
    const parcoursMap = new Map<string, DossierNode>()
    const etudiantMap = new Map<string, DossierNode>()

    for (const demande of this.demandesOrientation) {
      const annee = demande['anneeAcademique'] as any
      const anneeId = annee?.id || 'inconnue'
      const anneeLabel = annee?.libelle || 'Année inconnue'

      const parcoursChoisis = demande.parcoursChoisis || []
      const parcours = parcoursChoisis[0]?.parcours
      const niveau = parcours?.niveauEtude
      const niveauId = niveau?.id || 'inconnu'
      const niveauLabel = niveau?.libelle || 'Niveau inconnu'
      const parcoursId = parcours?.id || 'inconnu'
      const parcoursLabel = parcours?.titre || 'Parcours inconnu'

      const user = demande.utilisateur
      const etudiantId = user?.id || 'inconnu'
      const etudiantLabel = user ? `${user.nom} ${user.prenoms}` : 'Étudiant inconnu'

      if (!anneeMap.has(anneeId)) {
        anneeMap.set(anneeId, { type: 'annee', label: anneeLabel, id: anneeId, children: [], expanded: true })
      }
      const anneeNode = anneeMap.get(anneeId)!

      const niveauKey = `${anneeId}_${niveauId}`
      if (!niveauMap.has(niveauKey)) {
        const node: DossierNode = { type: 'niveau', label: niveauLabel, id: niveauId, children: [], expanded: true }
        niveauMap.set(niveauKey, node)
        anneeNode.children!.push(node)
      }
      const niveauNode = niveauMap.get(niveauKey)!

      const parcoursKey = `${niveauKey}_${parcoursId}`
      if (!parcoursMap.has(parcoursKey)) {
        const node: DossierNode = { type: 'parcours', label: parcoursLabel, id: parcoursId, children: [], expanded: true }
        parcoursMap.set(parcoursKey, node)
        niveauNode.children!.push(node)
      }
      const parcoursNode = parcoursMap.get(parcoursKey)!

      const etudiantKey = `${parcoursKey}_${etudiantId}`
      if (!etudiantMap.has(etudiantKey)) {
        const node: DossierNode = { type: 'etudiant', label: etudiantLabel, id: etudiantId, children: [], expanded: true }
        etudiantMap.set(etudiantKey, node)
        parcoursNode.children!.push(node)
      }
      const etudiantNode = etudiantMap.get(etudiantKey)!

      const statut = demande.reponseOrientation ? 'Terminé' : 'En cours'
      etudiantNode.items = etudiantNode.items || []
      etudiantNode.items.push({
        id: demande.id,
        dateDemande: demande.dateDemande,
        statut,
        parcours: parcoursChoisis.map(pc => pc.parcours?.titre).join(', '),
        _demande: demande
      })
    }

    this.dossierNodes = Array.from(anneeMap.values())
  }

  onBatchAction(ev: { action: string, ids: number[] }): void {
    if (ev.action === 'marquer_traite') {
      // TODO: call API to mark as treated
      console.log('Marquer traité:', ev.ids)
    }
  }

  onItemAction(ev: { item: any, action: string }): void {
    if (ev.action === 'marquer_traite' || ev.action === 'details') {
      this.router.navigate(['/orientation/demandes', ev.item.id])
    }
  }

  tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return DemandeOrientation.tauxDeTraitement(parcoursChoisis)
  }

  openModal(demandeOrientation: DemandeOrientation) {
    this.showModal = true
    this.selectedDemande = demandeOrientation
  }
  
  closeModal(): void {
    this.showModal = false
  }

  navigateToParcours(): void {
    this.showNouvelleDemandeModal = false
    this.router.navigate(['/orientation/parcours'])
  }

}
