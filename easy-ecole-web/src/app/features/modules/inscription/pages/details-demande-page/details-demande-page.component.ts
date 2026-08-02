import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EtatsValidationParcours } from 'src/app/data/enums/EtatsValidationParcours';
import { Apprenant } from 'src/app/data/modules/auth/models/Apprenant.model';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { ReponseInscriptionService } from 'src/app/data/modules/inscription/services/reponse-inscription.service';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { WizardItemType } from 'src/app/data/types/WizardItemType';
import { ReponseInscription } from 'src/app/data/modules/inscription/models/ReponseInscription.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { environment } from 'src/environments/environment';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { DemandeInscriptionCours } from 'src/app/data/modules/inscription/models/DemandeInscriptionCours.model';
import { EtatsCoursChoisi } from 'src/app/data/enums/EtatsCoursChoisi';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { EtatPreInscription } from 'src/app/data/modules/inscription/models/PreInscription.model';
import { PreInscriptionService } from 'src/app/data/modules/inscription/services/pre-inscription.service';

@Component({
  selector: 'app-details-demande-page',
  templateUrl: './details-demande-page.component.html',
  styleUrls: ['./details-demande-page.component.scss']
})
export class DetailsDemandePageComponent extends BaseComponentClass implements OnInit {

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  loading: boolean = true
  id: string
  apprenant?: Apprenant
  demande?: DemandeInscription
  showReponseModal: boolean = false
  demandeTraitee: boolean = true
  messageReponseInscription?: string

  parcoursFinal?: Parcours

  // Paiements
  fraisTotal: number = 0

  // Validation
  showValidationModal: boolean = false

  currentItemSection: number = 0
  wizardItems: WizardItemType[] = []
  requestedStep: string | null = null

  stepMessage: { text: string; type: 'success' | 'info' | 'warning' } | null = null

  classes: Classe[] = []
  anneesAcademiques: AnneeAcademique[] = []

  private pollingTimer: any = null
  private readonly POLL_INTERVAL = 15000

  validationDemandeInscriptionForm: FormGroup = new FormGroup({
    classe: new FormControl(null, [Validators.required]),
    anneeAcademique: new FormControl(null, [Validators.required]),
  })

  constructor(
    private coursService: CoursService,
    private demandeInscriptionService: DemandeInscriptionService,
    private reponseInscriptionService: ReponseInscriptionService,
    private preInscriptionService: PreInscriptionService,
    private classeService: ClasseService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.requestedStep = this.activatedRoute.snapshot.queryParamMap.get('step')
    this.getDemandeInscription()
  }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe(params => {
      const step = params.get('step');
      if (step) {
        this.requestedStep = step;
        if (this.demande) {
          this.initSteps();
        }
      } else if (this.requestedStep) {
        this.requestedStep = null;
        if (this.demande) {
          this.initSteps();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling()
  }

  private startPolling(): void {
    this.stopPolling()
    this.pollingTimer = setInterval(() => {
      this.getDemandeInscription()
    }, this.POLL_INTERVAL)
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  private getClasses(niveauEtudeId: string | undefined): void {
    this.classeService.getAll(niveauEtudeId)
    .subscribe({
      next: (res) => {
        this.classes = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  private getAnneesAcademiques(): void {
    this.anneeAcademiqueService.getAll()
    .subscribe({
      next: (res) => {
        this.anneesAcademiques = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  verifierStatut(): void {
    this.stepMessage = { text: 'Vérification du statut...', type: 'info' }
    this.getDemandeInscription()
  }

  getDemandeInscription(): void {
    this.loading = true
    this.demandeInscriptionService.get(this.id!)
      .subscribe({
        next: (res) => {
          this.demande = res
          this.loading = false
          console.log(res)
          this.initSteps()
        },
        error: (err) => {
          console.error('Erreur chargement demande:', err)
          this.loading = false
          if (err.status == 404) {
            this.router.navigate(['/inscription/demandes'])
          }
        }
      })
  }

  initWizardItems(): void {
    this.currentItemSection = 0

    this.wizardItems = [
      { text: "Informations personnelles", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 0 } },
      { text: "Choix parcours", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 1 } },
      { text: "Documents", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 2 } },
      { text: "Préinscription", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 3 } },
      { text: "Cours", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 4 } },
      { text: "Paiements", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 5 } },
      { text: "Validation", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 6 } },
    ]
  }

  onStepComplete(stepIndex: number, nextStepMessage: string): void {
    this.stepMessage = { text: nextStepMessage, type: 'success' }

    const nextRoute = this.getNextStudentRoute(stepIndex);
    if (nextRoute) {
      this.router.navigate([nextRoute.route], {
        queryParams: nextRoute.queryParams,
        replaceUrl: true
      });
      return;
    }

    if (stepIndex < 6) {
      this.currentItemSection = stepIndex + 1
    }
    setTimeout(() => {
      this.stepMessage = null
      this.getDemandeInscription()
    }, 800)
  }

  private getNextStudentRoute(stepIndex: number): { route: string; queryParams?: any } | null {
    if (!this.demande?.id) return null;
    if (this.rolesValue.isInstitution || this.rolesValue.isAdmin || !this.rolesValue.isApprenant) return null;

    switch (stepIndex) {
      case 0:
        return { route: `/inscription/demandes/${this.demande.id}/choix-parcours` };
      case 1:
        return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'documents' } };
      case 2:
        return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'preinscription' } };
      case 3:
        if (this.demande.preInscription?.statut === EtatPreInscription.VALIDE) {
          return { route: `/inscription/demandes/${this.demande.id}/choix-cours` };
        }
        return null;
      case 4:
        return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'paiements' } };
      case 5:
        return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'validation' } };
      default:
        return null;
    }
  }

  private getStepIndexFromParam(step: string | null): number | null {
    switch (step?.toLowerCase()) {
      case 'parcours':
        return 1;
      case 'documents':
        return 2;
      case 'preinscription':
        return 3;
      case 'cours':
        return 4;
      case 'paiements':
        return 5;
      case 'validation':
        return 6;
      default:
        return null;
    }
  }

  initSteps(): void {
    this.initWizardItems()

    const requestedStepIndex = this.getStepIndexFromParam(this.requestedStep);
    if (requestedStepIndex !== null) {
      this.currentItemSection = requestedStepIndex;
    }
    const demande = this.demande!
    const parcoursChoisis = demande.parcoursChoisis || []
    const session = demande.session

    // Check: informations personnelles (step 0)
    if (demande.utilisateur?.apprenant != null) {
      this.wizardItems[0].condition = true
      if (this.currentItemSection < 1) this.currentItemSection = 1
    }

    // Check: choix parcours (step 1)
    if (parcoursChoisis.length > 0) {
      this.wizardItems[1].condition = true

      if (demande.reponseInscription != null) {
        const hasChoixFinal = parcoursChoisis.some(e => e.choixFinal == true)
        if (!hasChoixFinal) {
          this.stepMessage = { text: 'Parcours soumis — en attente de votre choix final.', type: 'info' }
          if (this.currentItemSection < 1) this.currentItemSection = 1
        } else {
          this.parcoursFinal = parcoursChoisis.find(e => e.choixFinal == true)!.parcours
          this.currentItemSection = 2
          this.wizardItems[2].isBlocked = false
        }
      } else {
        // Student flow
        this.parcoursFinal = parcoursChoisis[0].parcours
        this.currentItemSection = 2
        this.wizardItems[2].isBlocked = false
      }
    } else {
      if (this.currentItemSection === 0 && demande.utilisateur?.apprenant != null) {
        this.stepMessage = { text: 'Informations enregistrées. Choisissez vos parcours.', type: 'success' }
      }
    }

    // Check: documents (step 2)
    if (this.currentItemSection >= 2) {
      if (session) {
        const dossiersRequis = session.dossiersInscription || []
        const dossiersUploades = demande.dossiersDemande || []
        if (dossiersRequis.length === 0 || dossiersUploades.length > 0) {
          this.wizardItems[2].condition = true
          this.wizardItems[2].incomplete = dossiersRequis.length > 0 && dossiersUploades.length !== dossiersRequis.length
          if (!this.wizardItems[2].incomplete) {
            this.currentItemSection = 3
            this.wizardItems[3].isBlocked = false
          }
        }
      }
    }

    // Check: préinscription (step 3)
    if (demande.preInscription != null) {
      this.wizardItems[3].condition = true
      const statut = demande.preInscription.statut

      if (statut === EtatPreInscription.VALIDE) {
        if (this.currentItemSection <= 3) {
          this.stepMessage = { text: 'Pré-inscription validée ! Choisissez vos cours.', type: 'success' }
        }
        this.currentItemSection = 4
        this.wizardItems[4].isBlocked = false

        if (this.checkCours()) {
          this.currentItemSection = 5
          this.wizardItems[4].condition = true

          if (this.checkFraisInscription()) {
            this.currentItemSection = 6
            this.wizardItems[5].condition = true

            if (demande.dateValidation != null) {
              this.wizardItems[6].condition = true
              this.stepMessage = { text: '✅ Inscription validée !', type: 'success' }
              this.stopPolling()
            }
          }
        }
      } else if (statut === EtatPreInscription.REJETE) {
        this.stepMessage = { text: 'Pré-inscription rejetée. Veuillez contacter l\'administration.', type: 'warning' }
        this.currentItemSection = 3
      } else {
        this.stepMessage = { text: 'Dossier soumis — en attente de validation par le comité d\'orientation.', type: 'info' }
        this.currentItemSection = 3
      }
    }

    this.autoPoll()
  }

  private autoPoll(): void {
    const pending = [0, 3, 5].includes(this.currentItemSection)
    if (pending) {
      this.startPolling()
    } else {
      this.stopPolling()
    }
  }

  private checkCours(): boolean {
    if (this.parcoursFinal && this.parcoursFinal.cours) {
      let coursObligatoires: Cours[] = this.parcoursFinal.cours.filter(element => element.estObligatoire == true)
      console.log(this.demande!.cours)

      if (coursObligatoires.length == 0) {
        // Premier cas: le parcours n'a pas de cours obligatoire
        return this.checkCoursChoisisValidation()
      }
      else {
        // 2e cas: le parcours a des cours obligatoire. On vérifie si tous les cours obligatoires ont été choisis
        if (this.demande!.cours && this.demande!.cours.length != 0) {
          console.log(this.demande!.cours)
          for (let index = 0; index < this.demande!.cours.length; index++) {
            const element = this.demande!.cours[index];
            
            if(element.estObligatoire) {
              if(coursObligatoires.find(value => value.id == element.id) == undefined) {
                return false
              }
            }
          }

          return this.checkCoursChoisisValidation()
        }
        else {
          return false
        }
      }
    }

    return false
  }

  private checkCoursChoisisValidation(): boolean {
    if (this.demande && this.demande.coursChoisis) {
      const coursChoisis: DemandeInscriptionCours[] = this.demande.coursChoisis.filter(coursChoisi => coursChoisi.etat == EtatsCoursChoisi.ENCOURS)
      console.log(coursChoisis)

      return coursChoisis.length == 0
    }

    return false
  }
 
  checkFraisInscription(): boolean {
    this.fraisTotal = 0
    const fraisInscription = this.demande?.session?.fraisInscription
    if (!fraisInscription) return false

    fraisInscription.forEach(element => {
      if (element.fraisDesCours) {
        const fraisDesCours = this.demande!.cours!.reduce((accumulator, currentValue) => {
          return accumulator + element.montant * (currentValue.credit ?? 0)
        }, 0)
        this.fraisTotal += fraisDesCours
      }
      else {
        this.fraisTotal += element.montant
      }
    })

    // Go to next step
    const fraisPayes: number = this.demande?.paiementsInscription?.reduce((accumulator, currentValue) => {
      return accumulator + (currentValue.montant ?? 0)
    }, 0) ?? 0

    return fraisPayes >= this.fraisTotal
  }

  envoyerReponseInscription(): void {
    let parcoursChoisis: ParcoursChoisi[] = this.demande!.parcoursChoisis!
    this.demandeTraitee = parcoursChoisis.filter((value) => value.etatDeValidation == EtatsValidationParcours.VALIDE || value.etatDeValidation == EtatsValidationParcours.REJETE).length == parcoursChoisis.length

    if (this.demandeTraitee) {
      let reponseInscription: ReponseInscription = new ReponseInscription()
      reponseInscription.message = this.messageReponseInscription
      reponseInscription.dateReponse = new Date()
      reponseInscription.demandeInscriptionId = this.demande?.id!

      this.reponseInscriptionService.create(reponseInscription)
        .subscribe({
          next: (res) => {
            console.log("OK: ", res)
            // this.router.navigate(['/inscription/demandes'])
            window.location.reload()
          },
          error: (err) => {
            console.log(err)
          }
        })
    }
  }

  envoyerValidationInscription(): void {
    this.validationDemandeInscriptionForm.markAllAsTouched()

    if(this.validationDemandeInscriptionForm.valid && this.parcoursFinal) {
      let cursusApprenant: CursusApprenant = new CursusApprenant()
      cursusApprenant.parcoursId = this.parcoursFinal.id
      cursusApprenant.niveauEtudeId = this.parcoursFinal.niveauEtudeId
      cursusApprenant.classeId = this.validationDemandeInscriptionForm.get('classe')!.value
      cursusApprenant.anneeAcademiqueId = this.validationDemandeInscriptionForm.get('anneeAcademique')!.value

      this.demandeInscriptionService.valider(this.demande!.id!, cursusApprenant).subscribe({
        next: (res) => {
          console.log("OK: ", res)
          window.location.reload()
        },
        error: (err) => {
          console.log(err)
        }
      })
    }
  }

  // Modals
  openValidationModal(): void {
    this.showValidationModal = true
    this.getClasses(this.demande?.session?.niveauEtudeId)
    this.getAnneesAcademiques()
  }

  closeReponseModal(): void {
    this.messageReponseInscription = undefined
    this.demandeTraitee = true
    this.showReponseModal = false
  }

  closeValidationModal(): void {
    this.showValidationModal = false
  }

}
