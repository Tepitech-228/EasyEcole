import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { DossierNode, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { ModaliteFraisScolarite } from 'src/app/data/modules/inscription/models/FraisScolarite.model';

@Component({
  selector: 'app-liste-sessions-page',
  templateUrl: './liste-sessions-page.component.html',
  styleUrls: ['./liste-sessions-page.component.scss']
})
export class ListeSessionsPageComponent extends BaseComponentClass implements OnInit {

  showNouvelleSessionModal: boolean = false
  TODAY_DATE: string = (new Date()).toISOString().split('T')[0]

  sessions: Session[] = []
  niveaux: NiveauEtude[] = []
  annees: AnneeAcademique[] = []
  dataLoaded: boolean = false
  readonly etatsSession = EtatsSession

  selectedAnneeId: string = ''
  selectedNiveauId: string = ''

  // Pagination
  currentPage: number = 1
  pageSize: number = 20
  totalItems: number = 0
  totalPages: number = 1

  // Dossier tree
  treeNodes: DossierNode[] = []
  itemColumns = [
    { key: 'dateDebut', label: 'Début' },
    { key: 'dateFin', label: 'Fin' },
    { key: 'statut', label: 'État' },
  ]
  itemActions: BatchAction[] = [
    { label: 'Détails', color: 'indigo', action: 'details', icon: 'visibility' },
  ]

  nouveauxFrais: Array<{ titre: string, montant: number, description: string, fraisDesCours: boolean }> = []
  nouveauxDossiers: Array<{ titre: string, tailleMax: number | null, description: string }> = []

  fraisScolariteMontant: number | null = null
  fraisScolariteModalite: ModaliteFraisScolarite = '10x'

  readonly modaliteOptions: { value: ModaliteFraisScolarite; label: string }[] = [
    { value: '1x', label: 'Paiement en 1 fois' },
    { value: '3x', label: '3 mensualités' },
    { value: '10x', label: '10 mensualités' },
  ]

  sessionForm: FormGroup = new FormGroup({
    dateDebut: new FormControl(this.TODAY_DATE, [Validators.required]),
    dateFin: new FormControl(null, [Validators.required]),
    niveauEtude: new FormControl(null, [Validators.required]),
    anneeAcademique: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor(
    private router: Router,
    private niveauEtudeService: NiveauEtudeService,
    private sessionService: SessionService,
    private anneeAcademiqueService: AnneeAcademiqueService) {
    super()
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    combineLatest([
      this.anneeAcademiqueService.getAll(),
      this.niveauEtudeService.getAll(),
    ]).subscribe({
      next: ([annees, niveaux]) => {
        this.annees = annees
        this.niveaux = niveaux
        this.dataLoaded = true
      },
      error: () => {
        this.dataLoaded = true
      }
    })
    this.getSessions()
  }

  onFilterChange(filters: { anneeId: string; niveauId: string; parcoursId: string }): void {
    this.selectedAnneeId = filters.anneeId
    this.selectedNiveauId = filters.niveauId
    this.currentPage = 1
    this.getSessions()
  }

  private getSessions(): void {
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
    }
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId

    this.sessionService.getAll(params)
    .subscribe({
      next: (res: any) => {
        this.sessions = res.data || res
        this.totalItems = res.pagination?.total || this.sessions.length
        this.totalPages = res.pagination?.totalPages || 1
        this.buildTreeNodes()
      },
      error: (err) => {
        console.log(err)
      },
    })
  }

  private buildTreeNodes(): void {
    const groups: { [key: string]: any } = {}
    for (const s of this.sessions) {
      const anneeKey: string = s.anneeAcademiqueId || 'sans-annee'
      const niveauKey: string = s.niveauEtudeId || 'sans-niveau'

      if (!groups[anneeKey]) groups[anneeKey] = {}
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = { items: [] }
      groups[anneeKey][niveauKey].items.push(s)
    }

    this.treeNodes = Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: this.getAnneeLibelle(anneeKey),
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, node]: [string, any]) => ({
        type: 'niveau' as const,
        label: this.getNiveauLibelle(niveauKey),
        expanded: true,
        items: node.items.map((s: Session) => ({
          id: s.id,
          dateDebut: s.dateDebut ? new Date(s.dateDebut).toLocaleDateString('fr-FR') : '---',
          dateFin: s.dateFin ? new Date(s.dateFin).toLocaleDateString('fr-FR') : '---',
          statut: this.getEtatLabel(Session.getEtat(s.dateDebut, s.dateFin)),
          _session: s,
        }))
      }))
    }))
  }

  getEtatLabel(etat: EtatsSession): string {
    switch (etat) {
      case EtatsSession.A_VENIR: return 'A venir'
      case EtatsSession.OUVERTE: return 'Ouverte'
      case EtatsSession.CLOTUREE: return 'Clôturée'
      default: return '---'
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page
    this.getSessions()
  }

  onItemAction(event: { item: any; action: string }): void {
    if (event.action === 'details' && event.item._session?.id) {
      this.router.navigate(['/inscription/sessions/' + event.item._session.id])
    }
  }

  getEtatSession(dateDebut: Date, dateFin: Date): EtatsSession {
    return Session.getEtat(dateDebut, dateFin);
  }

  ajouterSession(): void {
    this.sessionForm.markAllAsTouched()
    if(this.sessionForm.valid) {
      let session: any = {}
      session.dateDebut = this.sessionForm.get('dateDebut')!.value ?? new Date()
      session.dateFin = this.sessionForm.get('dateFin')!.value
      session.niveauEtudeId = this.sessionForm.get('niveauEtude')!.value
      session.anneeAcademiqueId = this.sessionForm.get('anneeAcademique')!.value
      session.description = this.sessionForm.get('description')!.value
      session.frais = this.nouveauxFrais
      session.dossiers = this.nouveauxDossiers
      if (this.fraisScolariteMontant && this.fraisScolariteMontant > 0) {
        session.fraisScolarite = {
          montant: this.fraisScolariteMontant,
          modalite: this.fraisScolariteModalite,
        }
      }

      this.sessionService.create(session).subscribe({
        next: (res) => {
          this.router.navigate(['/inscription/sessions/' + res.id])
        },
        error: (err) => {
          console.log(err)
        },
      })
    }
  }

  ajouterNouveauFrais(): void {
    this.nouveauxFrais.push({
      titre: '',
      montant: 0,
      description: '',
      fraisDesCours: false,
    })
  }

  supprimerNouveauFrais(index: number): void {
    this.nouveauxFrais.splice(index, 1)
  }

  ajouterNouveauDossier(): void {
    this.nouveauxDossiers.push({
      titre: '',
      tailleMax: null,
      description: '',
    })
  }

  supprimerNouveauDossier(index: number): void {
    this.nouveauxDossiers.splice(index, 1)
  }

  // Modals
  openNouvelleSessionModal(): void {
    this.getNiveauxEtude()
    this.getAnneesAcademiques()
    this.TODAY_DATE = (new Date()).toISOString().split('T')[0]
    this.sessionForm.get('dateDebut')!.setValue(this.TODAY_DATE)
    this.showNouvelleSessionModal = true
  }

  closeNouvelleSessionModal(): void {
    this.showNouvelleSessionModal = false
    this.sessionForm.reset()
    this.nouveauxFrais = []
    this.nouveauxDossiers = []
    this.fraisScolariteMontant = null
    this.fraisScolariteModalite = '10x'
  }

  private getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe({
        next: (res) => {
          this.niveaux = res
        },
        error: (err) => {
          console.log(err)
        },
      })
  }

  private getAnneesAcademiques(): void {
    this.anneeAcademiqueService.getAll()
    .subscribe({
      next: (res) => {
        this.annees = res
        this.sessionForm.get('anneeAcademique')!.setValue(this.annees[0].id)
      },
      error: (err) => {
        console.log(err)
      },
    })
  }

  private getAnneeLibelle(id: string): string {
    if (id === 'sans-annee') return 'Sans année'
    return this.annees.find(a => String(a.id) === String(id))?.libelle || `Année #${id}`
  }

  private getNiveauLibelle(id: string): string {
    if (id === 'sans-niveau') return 'Sans niveau'
    return this.niveaux.find(n => String(n.id) === String(id))?.libelle || `Niveau #${id}`
  }
}
