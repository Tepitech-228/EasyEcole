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
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';

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

  // Nouveau workflow : bordereaux d'inscription uploadés par l'étudiant
  bordereauxInscription: Bordereau[] = []

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
    private bordereauService: BordereauService,
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
    // Le spinner plein écran ne s'affiche QUE lors du premier chargement.
    // Pendant les rafraîchissements (polling 15s, bouton Vérifier), on ne démonte
    // pas la vue : sinon les modales ouvertes et le fichier sélectionné dans le
    // formulaire d'upload sont perdus à chaque cycle.
    if (!this.demande) {
      this.loading = true
    }
    this.demandeInscriptionService.get(this.id!)
      .subscribe({
        next: (res) => {
          this.demande = res
          this.loading = false
          console.log(res)
          if (this.rolesValue.isApprenant) {
            this.getBordereauxInscription()
          }
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

  /** Bordereaux d'inscription soumis par l'étudiant (nouveau workflow). */
  private getBordereauxInscription(): void {
    this.bordereauService.getAll({ type: 'inscription' }).subscribe({
      next: (res: any) => {
        const data = res?.data || res || []
        this.bordereauxInscription = Array.isArray(data)
          ? data.filter((b: any) => !b.type || b.type === 'inscription')
          : []
        this.initSteps()
      },
      error: () => {
        this.bordereauxInscription = []
      }
    })
  }

  /** Au moins un bordereau d'inscription actif (non rejeté) a été soumis par l'étudiant. */
  aBordereauInscriptionSoumis(): boolean {
    return this.bordereauxInscription.some(b => b.statut !== 'rejete')
  }

  /** Au moins un bordereau d'inscription a été rejeté par le service comptable. */
  aBordereauInscriptionRejete(): boolean {
    return this.bordereauxInscription.some(b => b.statut === 'rejete')
  }

  /** Au moins un bordereau d'inscription a été validé par le cabinet comptable. */
  aBordereauValide(): boolean {
    return this.bordereauxInscription.some(b => b.statut === 'valide')
  }

  /** La saisie ESA est finalisée pour au moins un bordereau. */
  saisieTerminee(): boolean {
    return this.bordereauxInscription.some(b => b.statutPaiement === 'finalise')
  }

  /** La saisie ESA est en cours pour au moins un bordereau. */
  saisieEnCours(): boolean {
    return this.bordereauxInscription.some(b => b.statutPaiement === 'saisi')
  }

initWizardItems(): void {
    this.currentItemSection = 0

    // FORCÉ : l'étape 4 (Paiement — Upload bordereau) est OBLIGATOIRE après les documents
    // Cette étape ne doit jamais être sautée — elle précède le traitement comptable
    // Aucun message comité ne doit apparaître à cette étape
    this.wizardItems = [
      { text: "Informations personnelles", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 0 } },
      { text: "Choix du parcours", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0v6m-6.5-2.5L12 20l6.5-2.5", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 1 } },
      { text: "Documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 2 } },
      { text: "Paiement — Upload bordereau", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 3 } },
      { text: "Traitement comptable", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 4 } },
      { text: "Saisie ESA Compta", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 5 } },
      { text: "Comité d'orientation", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 18 7.5 5S4.168 18 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 6 } },
      { text: "Cours + Validation finale", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", condition: false, incomplete: false, isBlocked: false, action: () => { this.currentItemSection = 7 } },
    ]
  }

  onStepComplete(stepIndex: number, nextStepMessage: string): void {
    this.stepMessage = { text: nextStepMessage, type: 'success' }

    const nextRoute = this.getNextStudentRoute(stepIndex);
    if (nextRoute) {
      // Si la navigation pointe vers l'URL courante, Angular l'annule (aucun
      // rechargement) et l'écran reste figé. On rafraîchit alors la demande.
      const targetUrl = this.router.createUrlTree([nextRoute.route], { queryParams: nextRoute.queryParams });
      if (this.router.url === this.router.serializeUrl(targetUrl)) {
        this.getDemandeInscription();
        return;
      }

      this.router.navigate([nextRoute.route], {
        queryParams: nextRoute.queryParams,
        replaceUrl: true
      });
      return;
    }

    if (stepIndex < 7) {
      this.currentItemSection = stepIndex + 1
    }
    setTimeout(() => {
      this.stepMessage = null
      this.getDemandeInscription()
    }, 800)
  }

  onDemandeUpdated(demande: DemandeInscription): void {
    this.demande = demande
  }

  private getNextStudentRoute(stepIndex: number): { route: string; queryParams?: any } | null {
    if (!this.demande?.id) return null;
    if (this.rolesValue.isInstitution || this.rolesValue.isAdmin || !this.rolesValue.isApprenant) return null;

    switch (stepIndex) {
      case 0:
      case 1:
      case 2:
        return this.getNextRelevantStudentRoute();
      case 3:
        // Étape paiement — upload bordereau : on peut aller au traitement comptable ou choisir les cours
        if (this.wizardItems[4]?.condition) {
          return this.getNextRelevantStudentRoute();
        }
        return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'paiement' } };
      case 4:
        // Étape traitement comptable : on peut aller à la saisie ESA
        if (this.wizardItems[5]?.condition) {
          return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'saisie-esa' } };
        }
        return this.getNextRelevantStudentRoute();
      case 5:
        // Étape saisie ESA Compta : on peut aller au comité
        if (this.wizardItems[6]?.condition) {
          return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'comite' } };
        }
        return this.getNextRelevantStudentRoute();
      case 6:
        // Étape comité d'orientation : aller à la validation finale
        if (this.wizardItems[7]?.condition) {
          return { route: `/inscription/demandes/${this.demande.id}`, queryParams: { step: 'validation' } };
        }
        return this.getNextRelevantStudentRoute();
      case 7:
        // Dernière étape : pas de navigation
        return null;
      default:
        return null;
    }
  }

  private getNextRelevantStudentRoute(): { route: string; queryParams?: any } | null {
    if (!this.demande?.id) return null;
    const id = this.demande.id;

    if (!this.hasSelectedParcours()) {
      return { route: `/inscription/demandes/${id}/choix-parcours` };
    }

    if (this.needsDocuments()) {
      return { route: `/inscription/demandes/${id}`, queryParams: { step: 'documents' } };
    }

    if (this.needsPayment()) {
      return { route: `/inscription/demandes/${id}`, queryParams: { step: 'paiement' } };
    }

    if (this.needsCourseSelection()) {
      return { route: `/inscription/demandes/${id}/choix-cours` };
    }

    if (this.needsValidation()) {
      return { route: `/inscription/demandes/${id}`, queryParams: { step: 'validation' } };
    }

    return null;
  }

  private hasSelectedParcours(): boolean {
    return !!(this.demande?.parcoursChoisis && this.demande.parcoursChoisis.length > 0);
  }

  private needsDocuments(): boolean {
    const session = this.demande?.session;
    if (!session) return false;

    const dossiersRequis = session.dossiersInscription || [];
    const dossiersUploades = this.demande?.dossiersDemande || [];

    return dossiersRequis.length > 0 && dossiersUploades.length !== dossiersRequis.length;
  }

  private needsCourseSelection(): boolean {
    return !this.checkCours();
  }

  private needsPayment(): boolean {
    // Nouveau workflow : un bordereau d'inscription soumis suffit à passer l'étape paiement.
    return !this.checkFraisInscription() && !this.aBordereauInscriptionSoumis();
  }

  private needsValidation(): boolean {
    return (this.checkFraisInscription() || this.aBordereauInscriptionSoumis()) && !this.demande?.dateValidation;
  }

  private getStepIndexFromParam(step: string | null): number | null {
    switch (step?.toLowerCase()) {
      case 'parcours':
        return 1;
      case 'documents':
        return 2;
      case 'paiement':
      case 'paiements':
        // Étape 4 du wizard : Paiement — Upload bordereau
        return 3;
      case 'comptable':
        // Étape 5 : Traitement comptable
        return 4;
      case 'saisie-esa':
        // Étape 6 : Saisie ESA Compta
        return 5;
      case 'comite':
        // Étape 7 : Comité d'orientation
        return 6;
      case 'validation':
        // Étape 8 : Cours + Validation finale
        return 7;
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

      const parcoursFinal = parcoursChoisis.find(e => e.choixFinal == true) ?? (parcoursChoisis.length === 1 ? parcoursChoisis[0] : undefined)

      if (demande.reponseInscription != null && parcoursChoisis.length > 1 && !parcoursFinal) {
        this.stepMessage = { text: 'Parcours soumis — en attente de votre choix final.', type: 'info' }
        if (this.currentItemSection < 1) this.currentItemSection = 1
      } else {
        this.parcoursFinal = parcoursFinal?.parcours
        // Ne jamais revenir en arrière : préserve l'étape demandée via ?step=
        if (this.currentItemSection < 2) this.currentItemSection = 2
        this.wizardItems[2].isBlocked = false
      }
    } else {
      if (this.currentItemSection === 0 && demande.utilisateur?.apprenant != null) {
        this.stepMessage = { text: 'Informations enregistrées. Choisissez vos parcours.', type: 'success' }
      }
    }

    // Check: documents (step 2)
    if (this.currentItemSection >= 2 && this.currentItemSection <= 3) {
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

    // Étape 3 = Paiement — Upload bordereau (atteinte dès que les documents sont complets).
    // L'ancien contournement "forcer currentItemSection à 4" est supprimé :
    // les sections du template sont maintenant alignées sur les indices des étapes.

    // Check: traitement comptable (step 4)
    // Le cabinet authentifie le bordereau → passe en état 'valide'
    if (this.currentItemSection >= 3 && this.aBordereauInscriptionSoumis()) {
      this.wizardItems[3].condition = true
    }

    // FLUX SÉQUENTIEL : cabinet authentifie (étape 4) → saisie ESA-COMPTA
    // OBLIGATOIRE (étape 5) → transmission automatique au comité (étape 6).
    // Le dossier reste BLOQUÉ à l'étape 5 tant que le service comptable n'a pas
    // terminé sa saisie (côté backend : statutPipeline passe à 'transmis_comite'
    // uniquement en fin de saisie, FinanceRouter.saisir).
    const bordereauAuthentifie = this.bordereauxInscription.find(b => b.statut === 'valide')
    const saisieEsaFaite = this.bordereauxInscription.some(b => b.statutPaiement === 'saisi' || b.statutPaiement === 'finalise')

    if (this.currentItemSection >= 4 && bordereauAuthentifie) {
      this.wizardItems[4].condition = true

      // Étape 5 (saisie ESA) : verrouillée tant que la saisie n'est pas faite.
      this.wizardItems[5].isBlocked = !saisieEsaFaite
      if (saisieEsaFaite) {
        this.wizardItems[5].condition = true
        this.wizardItems[6].isBlocked = false
        if (!this.demande?.dateValidation && this.currentItemSection < 6) {
          this.currentItemSection = 6
        }
        if (!this.demande?.dateValidation) {
          this.stepMessage = { text: "Saisie comptable terminée — dossier transmis au comité d'orientation.", type: 'info' }
        }
      } else if (this.currentItemSection < 6) {
        this.currentItemSection = 5
        this.stepMessage = { text: "Bordereau authentifié par le cabinet — en attente de la saisie du service comptable (ESA-COMPTA) avant transmission au comité.", type: 'info' }
      }
    }

    // Check: comité d'orientation (step 6)
    // La validation comité (dateValidation) débloque l'étape finale cours + validation
    if (this.currentItemSection >= 6) {
      if (this.demande?.dateValidation) {
        this.wizardItems[5].condition = true
        this.wizardItems[6].condition = true
        this.currentItemSection = 7
        this.wizardItems[7].isBlocked = false
      } else if (this.demande?.soumissionComite) {
        this.wizardItems[6].condition = true
        this.stepMessage = { text: "Dossier en cours d'examen par le comité.", type: 'info' }
      }
    }

    // Check: cours + validation finale (step 7)
    // La validation comité crée le DossierEtudiant, le matricule final, le CursusApprenant et les cours participants
    if (this.currentItemSection >= 7) {
      const hasDossierEtudiant = !!this.demande?.dateValidation
      if (hasDossierEtudiant) {
        this.wizardItems[7].condition = true
        this.stepMessage = { text: '✅ Inscription validée !', type: 'success' }
        this.stopPolling()
      } else {
        this.stepMessage = { text: 'En cours de finalisation...', type: 'info' }
      }
    }

    // Bordereau rejeté par la compta : retour à l'étape upload avec un avertissement.
    if (this.currentItemSection <= 3 && this.aBordereauInscriptionRejete() && !this.aBordereauInscriptionSoumis()) {
      this.currentItemSection = 3
      this.wizardItems[3].condition = false
      this.stepMessage = { text: 'Votre bordereau a été rejeté par le service comptable — veuillez en soumettre un nouveau.', type: 'warning' }
    }

    this.autoPoll()
  }

  private autoPoll(): void {
    // Étapes qui nécessitent un polling continu : infos personnelles, upload bordereau,
    // traitement comptable, saisie ESA, comité
    const pending = [0, 3, 4, 5, 6].includes(this.currentItemSection)
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

            if (element.estObligatoire) {
              if (coursObligatoires.find(value => value.id == element.id) == undefined) {
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

    // Parcours final défini mais aucun cours rattaché : rien à choisir, l'étape est acquise
    return this.parcoursFinal != null
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
    if (!fraisInscription) return true

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

  async deleteDemandeInscription(): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande d\'inscription ?')) return;
    try {
      await this.demandeInscriptionService.delete(this.id!).subscribe({
        next: () => {
          this.router.navigate(['/inscription/demandes']);
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
        }
      });
    } catch (err) {
      console.error('Erreur suppression:', err);
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
