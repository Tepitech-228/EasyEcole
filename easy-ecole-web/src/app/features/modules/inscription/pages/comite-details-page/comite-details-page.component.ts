import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComiteValidationService, DossierComite, Quorum } from 'src/app/data/modules/inscription/services/comite-validation.service';

const QUORUM_VIDE: Quorum = {
  totalMembres: 0, votesCount: 0, valides: 0, restants: 0,
  aVote: false, estUnanime: false, estRejete: false
}

@Component({
  selector: 'app-comite-details-page',
  templateUrl: './comite-details-page.component.html',
  styleUrls: ['./comite-details-page.component.scss']
})
export class ComiteDetailsPageComponent extends BaseComponentClass implements OnInit {

  dossier?: DossierComite
  loading: boolean = true
  error: boolean = false
  apiErrorMessage: string = ''

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comiteService: ComiteValidationService) {
    super()
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadDossier(params['id'])
      }
    })
  }

  private loadDossier(id: string): void {
    this.loading = true
    this.error = false
    this.comiteService.detailDossier(id).subscribe({
      next: (res) => {
        this.dossier = res.data
        this.loading = false
      },
      error: (err) => {
        console.error(err)
        this.apiErrorMessage = err?.error?.message || 'Erreur de chargement du dossier'
        this.error = true
        this.loading = false
      }
    })
  }

  // ── Helpers Quorum collégial ──

  getQuorum(d?: DossierComite | null): Quorum {
    return ((d ?? this.dossier)?.quorum) || QUORUM_VIDE
  }

  getQuorumLabel(d?: DossierComite | null): string {
    const q = this.getQuorum(d)
    if (q.totalMembres === 0) return '---'
    if (q.estUnanime) return `Unanimité (${q.valides}/${q.totalMembres})`
    if (q.estRejete) return `Rejeté (${q.votesCount}/${q.totalMembres})`
    return `${q.votesCount}/${q.totalMembres} votés — reste ${q.restants}`
  }

  getQuorumBadgeClass(d?: DossierComite | null): string {
    const q = this.getQuorum(d)
    if (q.estUnanime) return 'bg-green-100 text-green-800'
    if (q.estRejete) return 'bg-red-100 text-red-800'
    return 'bg-orange-100 text-orange-800'
  }

  getMembreVoteBadge(m: any): { label: string; cls: string } {
    if (!m?.vote) return { label: 'En attente', cls: 'bg-gray-100 text-gray-600' }
    switch (m.vote.decision) {
      case 'valide': return { label: 'Valide', cls: 'bg-green-100 text-green-800' }
      case 'rejete': return { label: 'Rejeté', cls: 'bg-red-100 text-red-800' }
      case 'correction_demandee': return { label: 'Correction', cls: 'bg-orange-100 text-orange-800' }
      default: return { label: 'En attente', cls: 'bg-gray-100 text-gray-600' }
    }
  }

  messageEtatQuorum(): string {
    const q = this.getQuorum(this.dossier)
    if (q.estRejete) return 'Dossier rejeté (veto)'
    if (q.estUnanime) return 'Unanimité atteinte'
    return `En attente de ${q.restants} vote(s)`
  }

  getQuorumProgressClass(): string {
    const q = this.getQuorum(this.dossier)
    if (q.totalMembres === 0) return 'bg-gray-200'
    const pct = Math.round((q.valides / q.totalMembres) * 100)
    if (q.estUnanime) return 'bg-green-500'
    if (q.estRejete) return 'bg-red-500'
    return pct >= 50 ? 'bg-orange-500' : 'bg-gray-400'
  }

  libelleDecision(d: string | null | undefined): string {
    const map: any = {
      'valide': 'Validé',
      'correction_demandee': 'Correction demandée',
      'rejete': 'Rejeté',
      'transmis_comite': 'En attente du comité',
      'authentifie': 'Authentifié (Audit)',
      'soumis': 'Soumis'
    }
    return map[d || ''] || (d || '---')
  }

  getStatutBadgeClass(statut?: string): string {
    switch (statut) {
      case 'valide': return 'bg-green-100 text-green-800'
      case 'en_attente': case 'transmis_comite': return 'bg-yellow-100 text-yellow-800'
      case 'correction_demandee': return 'bg-orange-100 text-orange-800'
      case 'rejete': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // ── Badge 1ère inscription / Réinscription ──

  estReinscription(d: any): boolean {
    return d?.typeDemande === 'reinscription' || d?.estReinscription === true
  }

  libelleTypeDemande(d: any): string {
    return this.estReinscription(d) ? 'Réinscription' : '1ère inscription'
  }

  retour(): void {
    this.router.navigate(['/inscription/comite-orientation'])
  }

  protected readonly QUORUM_VIDE = QUORUM_VIDE
}
