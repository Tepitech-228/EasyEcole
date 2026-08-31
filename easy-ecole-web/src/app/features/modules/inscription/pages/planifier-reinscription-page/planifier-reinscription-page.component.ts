import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ReinscriptionService } from 'src/app/data/modules/inscription/services/reinscription.service';

@Component({
  selector: 'app-planifier-reinscription-page',
  templateUrl: './planifier-reinscription-page.component.html',
  styleUrls: ['./planifier-reinscription-page.component.scss']
})
export class PlanifierReinscriptionPageComponent extends BaseComponentClass implements OnInit {

  loading = false
  submitting = false
  errorMessage = ''
  successMessage = ''

  eligibilite: any = null
  sessions: any[] = []
  planifications: any[] = []

  // Etape courante : 'verification' | 'session' | 'suivi'
  etape: 'verification' | 'session' | 'suivi' = 'verification'

  sessionsOuvertes: any[] = []
  sessionSelectionneeId?: number

  constructor(
    private router: Router,
    private reinscriptionService: ReinscriptionService
  ) {
    super()
    if (!this.rolesValue.isApprenant) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.loadEligibilite()
    this.loadPlanifications()
  }

  // ---------------------------------------------------------------------------
  // Chargements
  // ---------------------------------------------------------------------------

  loadEligibilite(): void {
    this.loading = true
    this.reinscriptionService.getEligibilite().subscribe({
      next: (res: any) => {
        this.eligibilite = res
        this.loading = false
      },
      error: (err) => {
        console.error('Erreur éligibilité:', err)
        this.loading = false
        this.errorMessage = err?.error?.message || 'Impossible de charger votre éligibilité'
      }
    })
  }

  loadSessions(): void {
    if (this.sessions.length > 0) {
      this.sessionsOuvertes = this.sessions
      return
    }
    this.reinscriptionService.getSessions().subscribe({
      next: (sessions: any) => {
        this.sessions = Array.isArray(sessions) ? sessions : []
        this.sessionsOuvertes = this.sessions
      },
      error: (err) => {
        console.error('Erreur chargement sessions:', err)
        this.errorMessage = 'Impossible de charger les sessions de réinscription'
      }
    })
  }

  loadPlanifications(): void {
    this.reinscriptionService.getMesPlanifications().subscribe({
      next: (res: any) => {
        this.planifications = (res?.planifications || []).filter((p: any) => p.statutReinscription === 'en_attente' || p.statutReinscription === 'confirme')
      },
      error: (err) => {
        console.error('Erreur chargement planifications:', err)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Workflow
  // ---------------------------------------------------------------------------

  get dejaInscrit(): boolean {
    return !!this.eligibilite?.dejaInscrit
  }

  get soldeDette(): number {
    return this.eligibilite?.soldeDette || 0
  }

  surSession(): void {
    this.loadSessions()
    this.etape = 'session'
  }

  sessionSelectionnee(): any {
    return this.sessionsOuvertes.find((s) => String(s.id) === String(this.sessionSelectionneeId))
  }

  planifier(): void {
    const session = this.sessionSelectionnee()
    if (!this.sessionSelectionneeId || !session) {
      this.errorMessage = 'Veuillez sélectionner une session de réinscription.'
      return
    }
    this.submitting = true
    this.errorMessage = ''
    this.reinscriptionService.creerPlanification({
      sessionId: Number(this.sessionSelectionneeId),
      anneeAcademiqueId: session.anneeAcademiqueId ?? undefined
    }).subscribe({
      next: () => {
        this.submitting = false
        this.successMessage = 'Votre demande de réinscription a été planifiée (en attente de validation).'
        this.etape = 'suivi'
        this.loadPlanifications()
      },
      error: (err) => {
        this.submitting = false
        this.errorMessage = err?.error?.message || 'Erreur lors de la planification de la réinscription'
      }
    })
  }

  annulerPlanification(id: number): void {
    this.submitting = true
    this.reinscriptionService.annulerPlanification(id).subscribe({
      next: () => {
        this.submitting = false
        this.successMessage = 'Planification annulée.'
        this.loadPlanifications()
      },
      error: (err) => {
        this.submitting = false
        this.errorMessage = err?.error?.message || 'Erreur lors de l\'annulation'
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Helpers d'affichage
  // ---------------------------------------------------------------------------

  getStatutLabel(statut?: string | null): string {
    switch (statut) {
      case 'confirme': return 'Confirmée'
      case 'abandon': return 'Abandonnée'
      case 'desactive': return 'Désactivée'
      default: return 'En attente de validation'
    }
  }

  getStatutColor(statut?: string | null): string {
    switch (statut) {
      case 'confirme': return 'green'
      case 'abandon': return 'red'
      case 'desactive': return 'gray'
      default: return 'yellow'
    }
  }

  get parcoursLabel(): string {
    return this.eligibilite?.cursus?.parcours?.titre || '—'
  }

  get niveauLabel(): string {
    return this.eligibilite?.cursus?.niveauEtude?.libelle || this.eligibilite?.cursus?.niveauEtude?.nom || '—'
  }

  get classeLabel(): string {
    return this.eligibilite?.cursus?.classe?.libelle || this.eligibilite?.cursus?.classe?.nom || '—'
  }

  get anneeLabel(): string {
    return this.eligibilite?.cursus?.anneeAcademique?.libelle || '—'
  }

  get matricule(): string {
    return this.eligibilite?.dossier?.matricule || '—'
  }

  formatMontant(n: number): string {
    return `${(n || 0).toLocaleString('fr-FR')} FCFA`
  }
}
