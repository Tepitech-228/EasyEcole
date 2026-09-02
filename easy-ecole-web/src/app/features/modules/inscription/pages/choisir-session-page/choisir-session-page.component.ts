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
  niveaux: NiveauEtude[] = []
  annees: AnneeAcademique[] = []
  parcoursList: Parcours[] = []

  selectedParcours: 'all' | 'licence' | 'master' | 'doctorat' = 'all'
  selectedFiliereId: string = 'all'

  readonly parcoursFilters = [
    { key: 'all', label: 'Tous' },
    { key: 'licence', label: 'Licence' },
    { key: 'master', label: 'Master' },
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
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadAnneesEtNiveaux()
    this.loadParcours()
    this.loadSessions()
    this.loadMesDemandes()
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
        this.sessions = all.filter(
          (s: any) => Session.getEtat(s.dateDebut, s.dateFin) === EtatsSession.OUVERTE
        )
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

  getParcoursFilterKey(libelle?: string): 'all' | 'licence' | 'master' | 'doctorat' {
    const normalized = (libelle || '').trim().toLowerCase()

    if (!normalized) return 'all'
    if (normalized.includes('doctorat')) return 'doctorat'
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

    // 1) Une demande existe déjà pour cette session → on continue le wizard
    const existante = this.findDemandeForSession(session.id)
    if (existante && existante.id) {
      this.router.navigate(['/inscription/demandes', existante.id])
      return
    }

    // 2) Sinon on crée la demande puis on redirige vers le wizard
    this.creationLoading = true
    this.errorMessage = null
    const body = { dateDemande: new Date(), sessionId: session.id }
    this.http.post(`${this.API_URL}/inscription/demandesInscription`, body).subscribe({
      next: (res: any) => {
        this.creationLoading = false
        if (res && res.id) {
          this.router.navigate(['/inscription/demandes', res.id])
        } else {
          this.router.navigate(['/inscription/demandes'])
        }
      },
      error: (err: HttpErrorResponse) => {
        this.creationLoading = false
        if (err.error?.alreadySignUp) {
          this.errorMessage = 'Vous avez déjà une demande d\'inscription en cours pour cette session.'
        } else {
          this.errorMessage = 'Une erreur est survenue lors de la création de votre demande. Réessayez.'
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
