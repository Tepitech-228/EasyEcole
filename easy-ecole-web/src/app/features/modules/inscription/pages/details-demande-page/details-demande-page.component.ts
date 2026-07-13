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

  classes: Classe[] = []
  anneesAcademiques: AnneeAcademique[] = []

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
    this.getDemandeInscription()
  }

  ngOnInit(): void {
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

  getDemandeInscription(): void {
    this.demandeInscriptionService.get(this.id!)
      .subscribe({
        next: (res) => {
          this.demande = res
          console.log(res)
          this.initSteps()
        },
        error: (err) => {
          console.log(err)
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

  initSteps(): void {
    this.initWizardItems()

    // Check: informations personnelles (step 0)
    if (this.demande!.utilisateur!.apprenant != null) {
      this.wizardItems[0].condition = true
      this.currentItemSection = 1
    }

    // Check: choix parcours (step 1)
    if (this.demande!.parcoursChoisis!.length != 0) {
      this.wizardItems[1].condition = true

      if (this.demande!.reponseInscription != null) {
        // Institution flow: reponse requise + choixFinal avant de continuer
        if (this.demande!.parcoursChoisis!.filter(element => element.choixFinal == true).length == 0) {
          this.currentItemSection = 1
        }
        else {
          this.parcoursFinal = this.demande!.parcoursChoisis!.filter(element => element.choixFinal == true)[0].parcours
          this.currentItemSection = 2
          this.wizardItems[2].isBlocked = false
        }
      }
      else {
        // Student flow: use first parcours as default final, proceed to documents
        this.parcoursFinal = this.demande!.parcoursChoisis![0].parcours
        this.currentItemSection = 2
        this.wizardItems[2].isBlocked = false
      }
    }

    // Check: documents (step 2) - moved before préinscription
    if (this.currentItemSection >= 2 && this.demande!.session) {
      const dossiersRequis = this.demande!.session!.dossiersInscription || []
      const dossiersUploades = this.demande!.dossiersDemande || []
      if (dossiersRequis.length == 0 || dossiersUploades.length != 0) {
        this.wizardItems[2].condition = true
        this.wizardItems[2].incomplete = dossiersRequis.length > 0 && dossiersUploades.length != dossiersRequis.length
        if (!this.wizardItems[2].incomplete) {
          this.currentItemSection = 3
          this.wizardItems[3].isBlocked = false
        }
      }
    }

    // Check: préinscription (step 3) - moved after documents
    if (this.demande!.preInscription != null) {
      this.wizardItems[3].condition = true
      if (this.demande!.preInscription!.statut == EtatPreInscription.VALIDE) {
        this.currentItemSection = 4

        this.wizardItems[4].isBlocked = false
        if (this.checkCours()) {
          this.currentItemSection = 5
          this.wizardItems[4].condition = true

          if (this.checkFraisInscription()) {
            this.currentItemSection = 6
            this.wizardItems[5].condition = true

            if (this.demande!.dateValidation != undefined) {
              this.wizardItems[6].condition = true
            }
          }
        }
      } else {
        this.currentItemSection = 3
      }
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
    this.demande!.session!.fraisInscription!.forEach(element => {
      this.fraisTotal = 0

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
    let fraisPayes: number = this.demande!.paiementsInscription?.reduce((accumulator, currentValue) => {
      return accumulator + (currentValue.montant ?? 0)
    }, 0) as number

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
