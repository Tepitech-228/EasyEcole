import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { DossierInscription } from 'src/app/data/modules/inscription/models/DossierInscription.model';
import { FraisInscription } from 'src/app/data/modules/inscription/models/FraisInscription.model';
import { FraisScolarite, ModaliteFraisScolarite } from 'src/app/data/modules/inscription/models/FraisScolarite.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DossierInscriptionService } from 'src/app/data/modules/inscription/services/dossier-inscription.service';
import { FraisInscriptionService } from 'src/app/data/modules/inscription/services/frais-inscription.service';
import { FraisScolariteService } from 'src/app/data/modules/inscription/services/frais-scolarite.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-details-session-page',
  templateUrl: './details-session-page.component.html',
  styleUrls: ['./details-session-page.component.scss']
})
export class DetailsSessionPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  alreadyExists: boolean = false

  showNouveauFraisModal: boolean = false
  showEditerFraisModal: boolean = false
  showSupprimerFraisModal: boolean = false
  showNouveauDossierModal: boolean = false
  showEditerDossierModal: boolean = false
  showSupprimerDossierModal: boolean = false
  showParametrerFraisScolariteModal: boolean = false

  selectedFrais?: FraisInscription
  selectedDossier?: DossierInscription
  fraisScolarite?: FraisScolarite
  fraisScolariteLoading: boolean = false
  fraisScolariteError: boolean = false

  readonly modaliteOptions: { value: ModaliteFraisScolarite; label: string }[] = [
    { value: '1x', label: 'Paiement en 1 fois' },
    { value: '3x', label: '3 mensualités' },
    { value: '10x', label: '10 mensualités' },
  ]

  id: string
  session?: Session
  readonly etatsSession = EtatsSession

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  fraisForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    montant: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
    fraisDesCours: new FormControl(false, [Validators.required]),
  })

  dossierForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    tailleMax: new FormControl(null, []),
    description: new FormControl(null, []),
  })

  fraisScolariteForm: FormGroup = new FormGroup({
    montant: new FormControl(null, [Validators.required]),
    modalite: new FormControl('10x', [Validators.required]),
    fraisInscription: new FormControl(null, []),
  })

  constructor(
    private sessionService: SessionService,
    private fraisInscriptionService: FraisInscriptionService,
    private dossierInscriptionService: DossierInscriptionService,
    private fraisScolariteService: FraisScolariteService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getSession()
    this.getFraisScolarite()
  }

  ngOnInit(): void {
  }

  getSession(): void {
    this.sessionService.get(this.id)
      .subscribe(
        {
          next: (res) => {
            this.session = res
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404) {
              this.router.navigate(['/inscription/sessions'])
            }
          },
        }
      )
  }

  getEtatSession(dateDebut: Date, dateFin: Date): EtatsSession {
    return Session.getEtat(dateDebut, dateFin);
  }

  getFraisScolarite(): void {
    this.fraisScolariteLoading = true
    this.fraisScolariteService.getBySession(this.id).subscribe({
      next: (res) => {
        this.fraisScolarite = res ?? undefined
        this.fraisScolariteLoading = false
      },
      error: (err) => {
        console.log(err)
        this.fraisScolariteLoading = false
      }
    })
  }

  get selectedModalite(): ModaliteFraisScolarite {
    return (this.fraisScolariteForm.get('modalite')?.value as ModaliteFraisScolarite) || '10x'
  }

  getModaliteDescription(modalite: ModaliteFraisScolarite): string {
    switch (modalite) {
      case '1x':
        return 'Paiement unique de la totalité des frais de scolarité.'
      case '3x':
        return 'Paiement réparti sur 3 mensualités.'
      case '10x':
        return 'Paiement réparti sur 10 mensualités.'
    }
  }

  getModaliteLabel(modalite?: ModaliteFraisScolarite): string {
    return this.modaliteOptions.find(option => option.value === modalite)?.label ?? '---'
  }

  getNombreEcheances(modalite: ModaliteFraisScolarite): number {
    return parseInt(modalite, 10)
  }

  getDetailEcheances(frais: FraisScolarite): string {
    const nombreEcheances: number = this.getNombreEcheances(frais.modalite)
    const montantEcheance: number = Math.round(frais.montant / nombreEcheances)
    return `${nombreEcheances} x ${montantEcheance.toLocaleString('fr-FR')} FCFA`
  }

  openParametrerFraisScolariteModal(): void {
    this.fraisScolariteForm.get('montant')!.setValue(this.fraisScolarite?.montant ?? null)
    this.fraisScolariteForm.get('modalite')!.setValue(this.fraisScolarite?.modalite ?? '10x')
    const fraisInscriptionExistant = this.getFraisInscriptionStandard()
    this.fraisScolariteForm.get('fraisInscription')!.setValue(fraisInscriptionExistant?.montant ?? null)
    this.fraisScolariteError = false
    this.showParametrerFraisScolariteModal = true
  }

  closeParametrerFraisScolariteModal(): void {
    this.showParametrerFraisScolariteModal = false
    this.fraisScolariteError = false
  }

  /** Frais d'inscription standard de la session (celui géré par la modale de paramétrage) */
  private getFraisInscriptionStandard(): FraisInscription | undefined {
    return (this.session?.fraisInscription || []).find(f => f.titre === 'Frais d\'inscription')
  }

  private echecParametrage(): void {
    this.fraisScolariteError = true
    setTimeout(() => {
      this.fraisScolariteError = false
    }, 3000)
  }

  /** Enregistre le montant des frais d'inscription saisi dans la modale de paramétrage (création ou mise à jour). */
  private enregistrerFraisInscription(montant: number | null): void {
    const terminer = (): void => {
      this.getSession()
      this.closeParametrerFraisScolariteModal()
    }

    if (!this.session || montant == null || montant === ('' as any)) {
      terminer()
      return
    }

    const existant = this.getFraisInscriptionStandard()
    const frais: FraisInscription = new FraisInscription()
    frais.titre = 'Frais d\'inscription'
    frais.montant = montant
    frais.fraisDesCours = existant?.fraisDesCours ?? false
    if (existant?.description) {
      frais.description = existant.description
    }
    frais.sessionId = this.session.id

    if (existant?.id) {
      frais.id = existant.id
      this.fraisInscriptionService.update(frais).subscribe({
        next: terminer,
        error: () => this.echecParametrage()
      })
    }
    else {
      this.fraisInscriptionService.create(frais).subscribe({
        next: terminer,
        error: () => this.echecParametrage()
      })
    }
  }

  parametrerFraisScolarite(): void {
    this.fraisScolariteForm.markAllAsTouched()
    if (this.fraisScolariteForm.valid && this.session) {
      let fraisScolarite: FraisScolarite = new FraisScolarite()
      fraisScolarite.sessionId = this.session.id
      fraisScolarite.montant = this.fraisScolariteForm.get('montant')!.value
      fraisScolarite.modalite = this.fraisScolariteForm.get('modalite')!.value

      const montantFraisInscription = this.fraisScolariteForm.get('fraisInscription')!.value

      this.fraisScolariteService.upsert(fraisScolarite).subscribe({
        next: () => {
          this.enregistrerFraisInscription(montantFraisInscription)
        },
        error: () => this.echecParametrage()
      })
    }
  }

  ajouterFrais(): void {
    console.log(this.fraisForm.value)
    this.fraisForm.markAllAsTouched()
    if (this.fraisForm.valid && this.session) {
      let frais: FraisInscription = new FraisInscription()
      frais.titre = this.fraisForm.get('titre')!.value
      frais.montant = this.fraisForm.get('montant')!.value
      frais.fraisDesCours = this.fraisForm.get('fraisDesCours')!.value
      frais.description = this.fraisForm.get('description')!.value
      frais.sessionId = this.session.id

      this.fraisInscriptionService.create(frais).subscribe({
        next: () => {
          this.getSession()
          this.closeNouveauFraisModal()
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
  }

  modifierFrais(): void {
    console.log(this.fraisForm.value)
    this.fraisForm.markAllAsTouched()
    if (this.fraisForm.valid && this.session && this.selectedFrais) {
      let frais: FraisInscription = new FraisInscription()
      frais.id = this.selectedFrais.id
      frais.titre = this.fraisForm.get('titre')!.value
      frais.montant = this.fraisForm.get('montant')!.value
      frais.description = this.fraisForm.get('description')!.value
      frais.fraisDesCours = this.fraisForm.get('fraisDesCours')!.value
      frais.sessionId = this.session.id

      this.fraisInscriptionService.update(frais).subscribe({
        next: (res) => {
          this.getSession()
          this.closeEditerFraisModal()
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
  }

  supprimerFrais(): void {
    if (this.selectedFrais) {
      this.fraisInscriptionService.delete(this.selectedFrais.id!).subscribe({
        next: (res) => {
          this.getSession()
          this.closeSupprimerFraisModal()
        },
        error: (err) => {
          console.log(err)
          this.error = true

          setTimeout(() => {
            this.error = false
          }, 3000)
        }
      })
    }
  }

  ajouterDossier(): void {
    console.log(this.dossierForm.value)
    this.dossierForm.markAllAsTouched()
    if (this.dossierForm.valid && this.session) {
      let dossier: DossierInscription = new DossierInscription()
      dossier.titre = this.dossierForm.get('titre')!.value
      dossier.tailleMax = this.dossierForm.get('tailleMax')!.value
      dossier.description = this.dossierForm.get('description')!.value
      dossier.sessionId = this.session.id

      this.dossierInscriptionService.create(dossier).subscribe({
        next: () => {
          this.getSession()
          this.closeNouveauDossierModal()
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
  }

  modifierDossier(): void {
    console.log(this.dossierForm.value)
    this.dossierForm.markAllAsTouched()
    if (this.dossierForm.valid && this.session && this.selectedDossier) {
      let dossier: DossierInscription = new DossierInscription()
      dossier.id = this.selectedDossier.id
      dossier.titre = this.dossierForm.get('titre')!.value
      dossier.tailleMax = this.dossierForm.get('tailleMax')!.value
      dossier.description = this.dossierForm.get('description')!.value
      dossier.sessionId = this.session.id

      this.dossierInscriptionService.update(dossier).subscribe({
        next: (res) => {
          this.getSession()
          this.closeEditerDossierModal()
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
  }

  supprimerDossier(): void {
    if (this.selectedDossier) {
      this.dossierInscriptionService.delete(this.selectedDossier.id!).subscribe({
        next: (res) => {
          this.getSession()
          this.closeSupprimerDossierModal()
        },
        error: (err) => {
          console.log(err)
          this.error = true

          setTimeout(() => {
            this.error = false
          }, 3000)
        }
      })
    }
  }

  // Modals
  closeNouveauFraisModal(): void {
    this.showNouveauFraisModal = false
    this.fraisForm.reset()
    this.fraisForm.get('fraisDesCours')!.setValue(false)
  }

  openEditerFraisModal(frais: FraisInscription): void {
    this.selectedFrais = frais

    this.fraisForm.get('titre')!.setValue(this.selectedFrais?.titre)
    this.fraisForm.get('montant')!.setValue(this.selectedFrais?.montant)
    this.fraisForm.get('description')!.setValue(this.selectedFrais?.description)
    this.fraisForm.get('fraisDesCours')!.setValue(this.selectedFrais?.fraisDesCours)

    this.showEditerFraisModal = true
  }

  closeEditerFraisModal(): void {
    this.showEditerFraisModal = false
    this.fraisForm.reset()
    this.fraisForm.get('fraisDesCours')!.setValue(false)
    this.selectedFrais = undefined
  }

  openSupprimerFraisModal(frais: FraisInscription): void {
    this.selectedFrais = frais
    this.showSupprimerFraisModal = true
  }

  closeSupprimerFraisModal(): void {
    this.showSupprimerFraisModal = false
    this.selectedFrais = undefined
  }


  closeNouveauDossierModal(): void {
    this.showNouveauDossierModal = false
    this.dossierForm.reset()
  }

  openEditerDossierModal(dossier: DossierInscription): void {
    this.selectedDossier = dossier

    this.dossierForm.get('titre')!.setValue(this.selectedDossier?.titre)
    this.dossierForm.get('tailleMax')!.setValue(this.selectedDossier?.tailleMax)
    this.dossierForm.get('description')!.setValue(this.selectedDossier?.description)

    this.showEditerDossierModal = true
  }

  closeEditerDossierModal(): void {
    this.showEditerDossierModal = false
    this.dossierForm.reset()
    this.selectedDossier = undefined
  }

  openSupprimerDossierModal(dossier: DossierInscription): void {
    this.selectedDossier = dossier
    this.showSupprimerDossierModal = true
  }

  closeSupprimerDossierModal(): void {
    this.showSupprimerDossierModal = false
    this.selectedDossier = undefined
  }
}
