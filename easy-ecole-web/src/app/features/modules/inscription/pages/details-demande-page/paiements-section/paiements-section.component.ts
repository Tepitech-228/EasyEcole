import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TypesPaiement } from 'src/app/data/enums/TypesPaiement';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionCours } from 'src/app/data/modules/inscription/models/DemandeInscriptionCours.model';
import { PaiementInscription } from 'src/app/data/modules/inscription/models/PaiementInscription.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { PaiementInscriptionService } from 'src/app/data/modules/inscription/services/paiement-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { environment } from 'src/environments/environment';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';

@Component({
  selector: 'app-paiements-section',
  templateUrl: './paiements-section.component.html',
  styleUrls: ['./paiements-section.component.scss']
})
export class PaiementsSectionComponent implements OnInit {

  error: boolean = false
  loading: boolean = false
  errorMessage: string = ''

  @Input() demande!: DemandeInscription
  @Input() coursChoisis?: DemandeInscriptionCours[]
  @Input() rolesValue!: RolesValueType
  @Output() nextStep: EventEmitter<any> = new EventEmitter()

  readonly typesPaiement = TypesPaiement
  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX
  session!: Session
  fraisAPayer: any[] = []
  fraisTotal: number = 0

  showPaiementModal: boolean = false
  paiementMontant?: number
  paiementDescription?: string
  paiementError: boolean = false

  // Nouveau workflow : upload de bordereau par l'étudiant
  bordereaux: Bordereau[] = []
  selectedFile?: File
  showUploadModal: boolean = false
  uploading: boolean = false
  uploadSuccess: string = ''

  constructor(
    private sessionService: SessionService,
    private paiementInscriptionService: PaiementInscriptionService,
    private bordereauService: BordereauService,
    private localStorage: LocalStorageService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit(): void {
    this.session = this.demande.session!
    this.getFraisInscription()
    if (this.rolesValue.isApprenant) {
      this.chargerBordereaux()
    }
  }

  /** Bordereaux d'inscription soumis par l'étudiant connecté. */
  chargerBordereaux(): void {
    this.bordereauService.getAll({ type: 'inscription' }).subscribe({
      next: (res: any) => {
        const data = res?.data || res || []
        this.bordereaux = Array.isArray(data)
          ? data.filter((b: any) => !b.type || b.type === 'inscription')
          : []
      },
      error: () => {
        this.bordereaux = []
      }
    })
  }

  onFileSelected(event: any): void {
    const file: File = event.target?.files?.[0]
    if (file) {
      this.selectedFile = file
    }
  }

  uploaderBordereau(): void {
    if (!this.selectedFile || this.uploading) return

    this.uploading = true
    this.errorMessage = ''
    const formData = new FormData()
    formData.append('fichier', this.selectedFile)
    formData.append('type', 'inscription')

    this.bordereauService.upload(formData).subscribe({
      next: () => {
        this.uploading = false
        this.selectedFile = undefined
        this.showUploadModal = false
        // Feedback visible : bannière de succès + rafraîchissement du wizard parent
        this.uploadSuccess = '✅ Bordereau uploadé avec succès — en attente de validation par le service comptable.'
        setTimeout(() => { this.uploadSuccess = '' }, 10000)
        this.chargerBordereaux()
        this.nextStep.emit()
      },
      error: (err: any) => {
        this.uploading = false
        // Message explicite selon la cause (rôle, auth, validation backend)
        if (err?.status === 403) {
          this.errorMessage = "Upload refusé : seul un compte étudiant (apprenant) peut soumettre un bordereau."
        } else if (err?.status === 401) {
          this.errorMessage = "Session expirée — veuillez vous reconnecter puis réessayer."
        } else {
          const backendMsg = err?.error?.message || err?.error?.error?.message || err?.error?.errors
          this.errorMessage = typeof backendMsg === 'string' && backendMsg ? backendMsg : "Erreur lors de l'upload du bordereau. Veuillez réessayer."
        }
        setTimeout(() => { this.errorMessage = '' }, 10000)
      }
    })
  }

  getDocUrl(fichier: string): SafeResourceUrl {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = this.BORDEREAUX_PATH + fichier
    if (token) {
      url += `?token=${encodeURIComponent(token)}`
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  isImageFile(fichier: string): boolean {
    return /\.(jpe?g|png|gif|webp)$/i.test(fichier)
  }

  // private getSession(id: string) {
  //   this.sessionService.get(id).subscribe({
  //     next: (value) => {
  //       this.session = value
  //       this.getFraisInscription()
  //     },
  //     error: (err) => {
  //       console.log(err)
  //     }
  //   })
  // }

  getFraisInscription(): void {
    this.loading = true
    this.errorMessage = ''

    const fraisInscription = this.session?.fraisInscription
    if (!fraisInscription || !this.coursChoisis) {
      this.loading = false
      if (!fraisInscription) {
        this.errorMessage = 'Aucun frais d\'inscription configuré pour cette session.'
      }
      return
    }

    for (const element of fraisInscription) {
      if (element.fraisDesCours) {
        const fraisDesCours = this.coursChoisis.reduce((accumulator, currentValue) => {
          return accumulator + element.montant * (currentValue.cours?.credit ?? 0)
        }, 0)
        this.fraisAPayer.push({ titre: 'Montant des cours', montant: fraisDesCours })
        this.fraisTotal += fraisDesCours
      }
      else {
        this.fraisTotal += element.montant
        this.fraisAPayer.push({ titre: element.titre, montant: element.montant })
      }
    }
    this.loading = false
  }

  getFraisPayes(): number {
    return this.demande!.paiementsInscription?.reduce((accumulator, currentValue) => {
      return accumulator + (currentValue.montant ?? 0)
    }, 0) as number
  }

  getFichePaiement(): void {
    if (this.demande?.id) {
      const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
      let url = `${environment.API_MODULES.INSCRIPTION}/demandesInscription/${this.demande.id}/fiche-paiement`
      if (token) url += `?token=${encodeURIComponent(token)}`
      window.open(url, '_blank')
    }
  }

  enregistrerPaiement(): void {
    if (!this.paiementMontant || this.paiementMontant <= 0) {
      this.paiementError = true
      return
    }

    this.paiementError = false
    const paiement: PaiementInscription = new PaiementInscription()
    paiement.montant = this.paiementMontant
    paiement.description = this.paiementDescription || "Paiement en espèces"
    paiement.matriculeInscription = this.demande?.matricule ?? ''
    paiement.datePaiement = new Date()

    this.paiementInscriptionService.create(paiement).subscribe({
      next: (res: any) => {
        if (res?.receiptUrl) {
          const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
          let url = res.receiptUrl
          if (token) url += `${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
          window.open(url, '_blank')
        }
        this.closePaiementModal()
        // Recharger les paiements sans recharger toute la page
        this.demande = { ...this.demande }
        if (this.demande.paiementsInscription) {
          this.demande.paiementsInscription.push(paiement)
        } else {
          this.demande.paiementsInscription = [paiement]
        }
      },
      error: (error) => {
        console.error('Erreur paiement:', error)
        this.paiementError = true
        this.errorMessage = 'Erreur lors de l\'enregistrement du paiement. Veuillez réessayer.'
        setTimeout(() => { this.errorMessage = '' }, 5000)
      }
    })
  }

  closePaiementModal(): void {
    this.showPaiementModal = false
    this.paiementMontant = undefined
    this.paiementDescription = undefined
    this.paiementError = false
  }

}
