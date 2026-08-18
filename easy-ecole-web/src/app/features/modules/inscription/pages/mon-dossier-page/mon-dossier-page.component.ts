import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { DocGenDocument } from 'src/app/data/modules/docgen/models/DocGenDocument.model';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { DossierEtudiant } from 'src/app/data/modules/inscription/models/DossierEtudiant.model';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';
import { environment } from 'src/environments/environment';

export interface AttestationType {
  typeCode: 'PRE001' | 'ADM020'
  label: string
  fileName: string
}

export const ATTESTATION_TYPES: AttestationType[] = [
  { typeCode: 'PRE001', label: "Attestation de préinscription", fileName: 'attestation-preinscription' },
  { typeCode: 'ADM020', label: "Attestation d'admissibilité", fileName: 'attestation-admissibilite' },
]

@Component({
  selector: 'app-mon-dossier-page',
  templateUrl: './mon-dossier-page.component.html',
  styleUrls: ['./mon-dossier-page.component.scss']
})
export class MonDossierPageComponent extends BaseComponentClass implements OnInit {

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  error: boolean = false
  dossier?: DossierEtudiant
  qrCodeData: string = ''

  readonly attestationTypes: AttestationType[] = ATTESTATION_TYPES
  attestationLoading: Record<string, boolean> = { PRE001: false, ADM020: false }

  constructor(
    private dossierEtudiantService: DossierEtudiantService,
    private docgenDocumentService: DocGenDocumentService,
    private toastService: ToastService,
    private router: Router
  ) {
    super()
  }

  ngOnInit(): void {
    if (this.rolesValue.isAdmin || this.rolesValue.isInstitution) {
      this.router.navigate(['/inscription/dossiers'])
      return
    }
    this.getMonDossier()
  }

  getMonDossier(): void {
    this.dossierEtudiantService.getMonDossier().subscribe({
      next: (res) => {
        this.dossier = res
        if (this.dossier?.codeQR) {
          this.qrCodeData = this.dossier.codeQR
        }
      },
      error: (err) => {
        console.log(err)
        this.error = true
      }
    })
  }

  getPhotoUrl(): string {
    if (this.dossier?.utilisateur?.apprenant?.photo) {
      return this.PHOTOS_PATH + this.dossier.utilisateur.apprenant.photo
    }
    return 'assets/images/blank-profile-picture.png'
  }

  get carteDownloadUrl(): string {
    return this.dossier?.id
      ? this.dossierEtudiantService.telechargerCarteUrl(this.dossier.id)
      : ''
  }

  telechargerCarte(): void {
    if (this.carteDownloadUrl) {
      window.open(this.carteDownloadUrl, '_blank')
    }
  }

  getStatutBadgeColor(statut?: string): string {
    switch (statut) {
      case 'actif': return 'green'
      case 'suspendu': return 'yellow'
      case 'archive': return 'red'
      default: return 'gray'
    }
  }

  getStatutEcheanceColor(statut?: string): string {
    switch (statut) {
      case 'paye': return 'green'
      case 'en_retard': return 'red'
      case 'impaye': return 'yellow'
      default: return 'gray'
    }
  }

  encodeURIComponent(value: string): string {
    return encodeURIComponent(value)
  }

  // ─────────────────────────────────────────────
  // Documentation officielle (attestations étudiant)
  // ─────────────────────────────────────────────

  isAttestationLoading(typeCode: string): boolean {
    return !!this.attestationLoading[typeCode]
  }

  telechargerAttestation(typeCode: 'PRE001' | 'ADM020'): void {
    const type = this.attestationTypes.find(t => t.typeCode === typeCode)
    if (!type) return

    this.attestationLoading[typeCode] = true

    this.docgenDocumentService.getMyDocuments().subscribe({
      next: (res) => {
        const existing = (res?.data || []).find(
          doc => doc.type?.code === typeCode && doc.statut === 'genere' && doc.id
        )
        if (existing?.id) {
          // Document déjà généré → téléchargement direct
          this.downloadDocument(existing, type)
        } else {
          // Aucun document → génération puis téléchargement
          this.generateEtTelecharger(type)
        }
      },
      error: (err) => {
        console.error('Impossible de récupérer les documents existants', err)
        // On tente quand même une génération (comportement de repli)
        this.generateEtTelecharger(type)
      }
    })
  }

  private generateEtTelecharger(type: AttestationType): void {
    this.docgenDocumentService.generateStudent({ typeCode: type.typeCode }).subscribe({
      next: (res) => {
        const generated = (res?.data || []).find(d => d.id)
        if (!generated?.id) {
          this.attestationLoading[type.typeCode] = false
          this.toastService.error('Aucun document n\'a pu être généré. Contactez l\'administration.')
          return
        }
        this.downloadDocument(generated, type)
      },
      error: (err) => {
        console.error(err)
        this.attestationLoading[type.typeCode] = false
        const message = err?.error?.message || 'La génération du document a échoué.'
        this.toastService.error(message)
      }
    })
  }

  private downloadDocument(doc: DocGenDocument, type: AttestationType): void {
    if (!doc.id) return
    this.docgenDocumentService.download(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${doc.reference || type.fileName}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        this.attestationLoading[type.typeCode] = false
        this.toastService.success(`${type.label} téléchargée.`)
      },
      error: (err) => {
        console.error(err)
        this.attestationLoading[type.typeCode] = false
        this.toastService.error('Le téléchargement du PDF a échoué.')
      }
    })
  }
}
