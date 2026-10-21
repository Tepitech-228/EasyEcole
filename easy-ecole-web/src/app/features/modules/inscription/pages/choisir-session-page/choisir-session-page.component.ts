import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { environment } from 'src/environments/environment';
import { AuthService, SiteUtilisateur } from 'src/app/data/modules/auth/services/auth.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

/**
 * Page de choix de session d'inscription (réservée aux apprenants).
 *
 * Affiche les sessions d'inscription OUVERTES sous forme de cartes cliquables.
 * Lorsque l'apprenant en choisit une :
 *  - s'il existe déjà une demande d'inscription pour cette session → redirection
 *    vers le wizard (/inscription/demandes/:id, étape correspondante) ;
 *  - sinon → création de la demande via POST /inscription/demandesInscription
 *    puis redirection vers le wizard.
 */
@Component({
  selector: 'app-choisir-session-page',
  templateUrl: './choisir-session-page.component.html',
  styleUrls: ['./choisir-session-page.component.scss']
})
export class ChoisirSessionPageComponent extends BaseComponentClass implements OnInit {

  loading: boolean = true
  creationLoading: boolean = false

  sessions: Session[] = []
  private sessionsChargees: Session[] = []
  sitesDisponibles: SiteUtilisateur[] = []
  siteSelectionneId = ''
  siteVerrouille = false
  sitesLoading = false
  sitesError = ''
  niveaux: NiveauEtude[] = []
  annees: AnneeAcademique[] = []
  parcoursList: Parcours[] = []

  selectedParcours: 'all' | 'licence' | 'master' | 'mba' | 'bts' | 'doctorat' = 'all'
  selectedFiliereId: string = 'all'

  readonly parcoursFilters = [
    { key: 'all', label: 'Tous' },
    { key: 'licence', label: 'Licence' },
    { key: 'master', label: 'Master' },
    { key: 'mba', label: 'MBA' },
    { key: 'bts', label: 'BTS' },
    { key: 'doctorat', label: 'Doctorat' }
  ] as const

  // Demandes d'inscription de l'apprenant (pour ne pas en recréer une deux fois)
  mesDemandes: any[] = []

  errorMessage: string | null = null

  readonly etatsSession = EtatsSession
  readonly API_URL = environment.API_URL

  constructor(
    private router: Router,
    private http: HttpClient,
    private niveauEtudeService: NiveauEtudeService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private parcoursService: ParcoursService,
    private authService: AuthService,
    private localStorage: LocalStorageService,
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadAnneesEtNiveaux()
    this.loadParcours()
    this.loadSites()
    this.loadSessions()
    this.loadMesDemandes()
  }

  private loadSites(): void {
    this.sitesLoading = true
    this.sitesError = ''
    this.authService.getSitesMoi().subscribe({
      next: sites => {
        this.sitesDisponibles = sites
        this.sitesLoading = false
      },
      error: () => {
        this.sitesLoading = false
        this.sitesError = 'Impossible de charger les sites disponibles pour votre inscription.'
      }
    })
  }

  onChoixSite(): void {
    if (this.siteVerrouille) return
    const siteId = Number(this.siteSelectionneId)
    if (Number.isSafeInteger(siteId) && siteId > 0) {
      this.activerSiteSelectionne(siteId)
    }
  }

  private activerSiteSelectionne(siteId: number): void {
    this.sitesLoading = true
    this.authService.definirSiteActif(siteId).subscribe({
      next: response => {
        if (!response.accessToken) {
          this.sitesError = 'Le site choisi n’a pas pu être activé.'
          this.sitesLoading = false
          return
        }
        this.localStorage.set(LocalStorageService.AUTH_TOKEN, response.accessToken)
        this.siteSelectionneId = String(response.etablissementId)
        this.siteVerrouille = true
        this.sitesError = ''
        this.sitesLoading = false
      },
      error: err => {
        this.sitesError = err?.error?.message || 'Le site choisi n’a pas pu être affecté à votre compte.'
        this.sitesLoading = false
      }
    })
  }

  private loadAnneesEtNiveaux(): void {
    this.niveauEtudeService.getAll().subscribe({
      next: (niveaux) => this.niveaux = niveaux,
      error: () => {}
    });
    this.anneeAcademiqueService.getAll().subscribe({
      next: (annees) => this.annees = annees,
      error: () => {}
    });
  }

  private loadParcours(): void {
    this.parcoursService.getAll().subscribe({
      next: (parcours) => {
        this.parcoursList = parcours || []
        if (this.selectedFiliereId !== 'all') {
          const selectedParcours = this.parcoursList.find(p => String(p.id) === String(this.selectedFiliereId))
          if (selectedParcours && selectedParcours.niveauEtudeId) {
            const level = this.getParcoursFilterKey(this.getNiveauLibelle(String(selectedParcours.niveauEtudeId)))
            if (level !== 'all') {
              this.selectedParcours = level
            }
          }
        }
      },
      error: () => {
        this.parcoursList = []
      }
    })
  }

  private loadSessions(): void {
    this.loading = true
    this.http.get(`${this.API_URL}/inscription/sessions`).subscribe({
      next: (res: any) => {
        const all = Array.isArray(res) ? res : (res?.data || [])
        // Ne montrer que les sessions ouvertes
        this.sessionsChargees = all.filter(
          (s: any) => Session.getEtat(s.dateDebut, s.dateFin) === EtatsSession.OUVERTE
        )
        this.sessions = this.sessionsChargees
        this.loading = false
      },
      error: () => {
        this.loading = false
        this.errorMessage = 'Impossible de récupérer les sessions d\'inscription. Réessayez plus tard.'
      }
    })
  }

  private loadMesDemandes(): void {
    this.http.get(`${this.API_URL}/inscription/demandesInscription`).subscribe({
      next: (res: any) => {
        this.mesDemandes = Array.isArray(res) ? res : (res?.data || [])
      },
      error: () => {}
    })
  }

  getEtatLabel(s: Session): string {
    return Session.getEtat(s.dateDebut, s.dateFin) === EtatsSession.OUVERTE ? 'Ouverte' : 'Fermée'
  }

  get siteNomSelectionne(): string {
    return this.sitesDisponibles.find(site => String(site.id) === this.siteSelectionneId)?.nom || ''
  }

  get filteredSessions(): Session[] {
    return this.sessions.filter((session: Session) => {
      const niveauLibelle = this.getNiveauLibelle(session.niveauEtudeId)
      const parcoursKey = this.getParcoursFilterKey(niveauLibelle)

      if (this.selectedParcours !== 'all' && parcoursKey !== this.selectedParcours) {
        return false
      }

      if (this.selectedFiliereId !== 'all') {
        const selectedParcours = this.parcoursList.find(p => String(p.id) === String(this.selectedFiliereId))
        if (!selectedParcours) return false
        const selectedNiveauId = selectedParcours.niveauEtudeId ? String(selectedParcours.niveauEtudeId) : null
        if (!selectedNiveauId) return false
        return String(session.niveauEtudeId) === selectedNiveauId
      }

      return true
    })
  }

  get filieresDisponibles(): Parcours[] {
    const niveauxFiltres = this.parcoursList.filter((parcours) => {
      const niveauLibelle = this.getNiveauLibelle(String(parcours.niveauEtudeId || ''))
      if (this.selectedParcours === 'all') return true
      return this.getParcoursFilterKey(niveauLibelle) === this.selectedParcours
    })

    return niveauxFiltres.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''))
  }

  onParcoursFilterChange(): void {
    if (this.selectedFiliereId !== 'all') {
      const selectedParcours = this.parcoursList.find(p => String(p.id) === String(this.selectedFiliereId))
      if (selectedParcours && selectedParcours.niveauEtudeId) {
        const niveauKey = this.getParcoursFilterKey(this.getNiveauLibelle(String(selectedParcours.niveauEtudeId)))
        if (niveauKey !== 'all') {
          this.selectedParcours = niveauKey
        }
      }
    }
  }

  getNiveauLibelle(id: string): string {
    if (!id) return ''
    return this.niveaux.find(n => String(n.id) === String(id))?.libelle || ''
  }

  getParcoursFilterKey(libelle?: string): 'all' | 'licence' | 'master' | 'mba' | 'bts' | 'doctorat' {
    const normalized = (libelle || '').trim().toLowerCase()

    if (!normalized) return 'all'
    if (normalized.includes('doctorat')) return 'doctorat'
    if (normalized.includes('mba')) return 'mba'
    if (normalized.includes('bts')) return 'bts'
    if (normalized.includes('master')) return 'master'
    if (normalized.includes('licence')) return 'licence'

    return 'all'
  }

  getAnneeLibelle(id: string): string {
    if (!id) return ''
    return this.annees.find(a => String(a.id) === String(id))?.libelle || ''
  }

  private findDemandeForSession(sessionId: string): any {
    return this.mesDemandes.find(
      (d: any) => d.sessionId && String(d.sessionId) === String(sessionId)
    )
  }

  choisirSession(session: Session): void {
    if (this.creationLoading) return

    const etablissementId = Number(this.siteSelectionneId)
    if (!Number.isSafeInteger(etablissementId) || etablissementId <= 0) {
      this.errorMessage = 'Choisissez d’abord votre site d’inscription.'
      return
    }
    if (!this.siteVerrouille) {
      this.errorMessage = 'Le site choisi doit être activé avant de poursuivre.'
      return
    }

    this.creationLoading = true
    this.errorMessage = null
    const ouvrirWizard = (demandeId: string): void => {
      this.creationLoading = false
      this.router.navigate(['/inscription/demandes', demandeId], {
        queryParams: { sessionId: session.id, niveauEtudeId: session.niveauEtudeId }
      })
    }

    // Une demande existe déjà pour cette session : on reprend le wizard.
    const existante = this.findDemandeForSession(session.id)
    if (existante?.id) {
      ouvrirWizard(String(existante.id))
      return
    }

    const body = { dateDemande: new Date(), sessionId: session.id, etablissementId }
    this.http.post<any>(`${this.API_URL}/inscription/demandesInscription`, body).subscribe({
      next: demande => {
        if (demande?.id) {
          ouvrirWizard(String(demande.id))
        } else {
          this.creationLoading = false
          this.errorMessage = 'La demande a été créée sans identifiant exploitable. Rechargez « Mes demandes ».'
        }
      },
      error: (err: HttpErrorResponse) => {
        this.creationLoading = false
        if (err.error?.alreadySignUp) {
          this.errorMessage = 'Vous avez déjà une demande d\'inscription en cours pour cette session.'
        } else {
          this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la création de votre demande. Réessayez.'
        }
      }
    })
  }

  retry(): void {
    this.errorMessage = null
    this.loadSessions()
    this.loadMesDemandes()
  }
}
