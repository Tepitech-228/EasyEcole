import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { DossierComite, ComiteValidationService } from 'src/app/data/modules/inscription/services/comite-validation.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-comite-validation-page',
  templateUrl: './comite-validation-page.component.html',
  styleUrls: ['./comite-validation-page.component.scss']
})
export class ComiteValidationPageComponent extends BaseComponentClass implements OnInit {

  dossiers: (DossierComite & { bordereaux?: any[] })[] = []
  loading: boolean = true
  error: boolean = false
  apiErrorMessage: string = ''

  afficherTous: boolean = false

  selectedDossier: any = null
  detailComplet: any = null
  showDetailModal: boolean = false
  loadingDetail: boolean = false

  decisionEnCours: 'valide' | 'correction_demandee' | 'rejete' | null = null
  motifDecision: string = ''
  processingDecision: boolean = false
  successMessage: string = ''

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  constructor(
    private comiteService: ComiteValidationService,
    private localStorage: LocalStorageService
  ) {
    super()
  }

  ngOnInit(): void {
    this.charger()
  }

  charger(): void {
    this.loading = true
    this.error = false
    this.comiteService.listerDossiers(this.afficherTous).subscribe({
      next: (res) => { this.dossiers = res.data || []; this.loading = false },
      error: (err) => {
        console.error(err)
        this.apiErrorMessage = err?.error?.message || 'Erreur de chargement des dossiers'
        this.error = true
        this.loading = false
      }
    })
  }

  getParcoursFinal(d: any): string {
    const pFinal = d?.parcoursChoisis?.find((pc: any) => pc.choixFinal === true || pc.choixFinal === 1 || pc.choixFinal === '1')
    const p = pFinal || d?.parcoursChoisis?.[0]
    return p?.parcours ? `${p.parcours.titre || ''} (${p.parcours.type || ''})` : '---'
  }

  getAnnee(d: any): string {
    return d?.session?.anneeAcademique?.libelle || '---'
  }

  nbDocuments(d: any): number {
    return d?.dossiersDemande?.length ?? 0
  }

  totalBordereaux(d: any): string {
    const montants = (d?.bordereaux || [])
      .filter((b: any) => b.statut === 'traite' && b.montant)
      .map((b: any) => Number(b.montant))
    if (!montants.length) return '---'
    return new Intl.NumberFormat('fr-FR').format(montants.reduce((a: number, b: number) => a + b, 0)) + ' FCFA'
  }

  ouvrirDetail(d: any): void {
    this.selectedDossier = d
    this.detailComplet = null
    this.showDetailModal = true
    this.loadingDetail = true
    this.comiteService.detailDossier(d.id).subscribe({
      next: (res) => { this.detailComplet = res.data; this.loadingDetail = false },
      error: () => { this.loadingDetail = false }
    })
  }

  fermerDetail(): void {
    this.showDetailModal = false
    this.selectedDossier = null
    this.detailComplet = null
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  preparerDecision(decision: 'valide' | 'correction_demandee' | 'rejete'): void {
    this.decisionEnCours = decision
    this.motifDecision = ''
  }

  annulerDecision(): void {
    this.decisionEnCours = null
    this.motifDecision = ''
  }

  confirmerDecision(): void {
    if (!this.selectedDossier?.id || !this.decisionEnCours) return
    if (this.decisionEnCours !== 'valide' && !this.motifDecision.trim()) return

    this.processingDecision = true
    this.comiteService.decider(this.selectedDossier.id, this.decisionEnCours, this.motifDecision).subscribe({
      next: (res) => {
        this.processingDecision = false
        const matricule = res?.data?.matricule
        this.successMessage = this.decisionEnCours === 'valide'
          ? `Inscription validée${matricule ? ' — Matricule : ' + matricule : ''}. L'étudiant a été notifié par email.`
          : `Décision enregistrée (« ${this.libelleDecision(this.decisionEnCours)} ») et notifiée à l'étudiant.`
        this.fermerDetail()
        this.charger()
        setTimeout(() => this.successMessage = '', 8000)
      },
      error: (err) => {
        console.error(err)
        this.apiErrorMessage = err?.error?.message || 'Erreur lors de l\'enregistrement de la décision'
        this.error = true
        this.processingDecision = false
        setTimeout(() => { this.error = false; this.apiErrorMessage = '' }, 6000)
      }
    })
  }

  libelleDecision(d: string | null | undefined): string {
    const map: any = {
      'valide': 'Validé',
      'correction_demandee': 'Correction demandée',
      'rejete': 'Rejeté',
      'transmis_comite': 'En attente du comité',
      'authentifie': 'Authentifié (cabinet)',
      'soumis': 'Soumis'
    }
    return map[d || ''] || (d || '---')
  }

  getDocUrl(fichier: string): string {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = this.BORDEREAUX_PATH + fichier
    if (token) url += `?token=${encodeURIComponent(token)}`
    return url
  }

  isImageFile(fichier: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fichier || '')
  }

  formatMontant(v: any): string {
    if (v == null) return '---'
    return new Intl.NumberFormat('fr-FR').format(Number(v)) + ' FCFA'
  }
}
