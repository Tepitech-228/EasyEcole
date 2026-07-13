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

@Component({
  selector: 'app-liste-dossiers-page',
  templateUrl: './liste-dossiers-page.component.html',
  styleUrls: ['./liste-dossiers-page.component.scss']
})
export class ListeDossiersPageComponent extends BaseComponentClass implements OnInit {

  dossiers: DossierEtudiant[] = []
  error: boolean = false

  annees: AnneeAcademique[] = []
  niveaux: NiveauEtude[] = []
  parcoursList: Parcours[] = []
  sessions: Session[] = []

  selectedAnneeId: string = ''
  selectedNiveauId: string = ''
  selectedParcoursId: string = ''

  niveauxFiltres: NiveauEtude[] = []
  parcoursFiltres: Parcours[] = []

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

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

  onAnneeChange(): void {
    this.selectedNiveauId = ''
    this.selectedParcoursId = ''
    this.niveauxFiltres = []

    if (this.selectedAnneeId) {
      const niveauIds = this.sessions
        .filter(s => s.anneeAcademiqueId === this.selectedAnneeId)
        .map(s => s.niveauEtudeId)
      this.niveauxFiltres = this.niveaux.filter(n => niveauIds.includes(n.id))
    }
    this.getDossiers()
  }

  onNiveauChange(): void {
    this.selectedParcoursId = ''

    if (this.selectedNiveauId) {
      this.parcoursFiltres = this.parcoursList.filter(p => p.niveauEtudeId === this.selectedNiveauId)
    } else {
      this.parcoursFiltres = []
    }
    this.getDossiers()
  }

  onParcoursChange(): void {
    this.getDossiers()
  }

  effriterFiltres(): void {
    this.selectedAnneeId = ''
    this.selectedNiveauId = ''
    this.selectedParcoursId = ''
    this.niveauxFiltres = []
    this.parcoursFiltres = []
    this.getDossiers()
  }

  getDossiers(): void {
    const params: any = {}
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId

    this.dossierEtudiantService.getAll(params).subscribe({
      next: (res) => {
        this.dossiers = res
      },
      error: (err) => {
        console.log(err)
        this.error = true
      }
    })
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

  getStatutBadgeColor(statut?: string): string {
    switch (statut) {
      case 'actif': return 'green'
      case 'suspendu': return 'yellow'
      case 'archive': return 'red'
      default: return 'gray'
    }
  }

  getPhotoUrl(dossier: DossierEtudiant): string {
    if (dossier.utilisateur?.apprenant?.photo) {
      return this.PHOTOS_PATH + dossier.utilisateur.apprenant.photo
    }
    return 'assets/images/blank-profile-picture.png'
  }
}
