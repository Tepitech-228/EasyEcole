import { ToastService } from 'src/app/core/services/toast.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { ParcoursChoisiService } from 'src/app/data/modules/inscription/services/parcours-choisi.service';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { ApprenantService } from 'src/app/data/modules/auth/services/apprenant.service';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { DossierInscriptionService } from 'src/app/data/modules/inscription/services/dossier-inscription.service';
import { InscriptionWizardStoreService, FichierMeta } from 'src/app/data/modules/inscription/services/inscription-wizard-store.service';
import { WizardItemType } from 'src/app/data/types/WizardItemType';
import { AuthService, SiteUtilisateur } from 'src/app/data/modules/auth/services/auth.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { environment } from 'src/environments/environment';

interface FiliereSelection {
  id: string;
  titre: string;
  type?: string;
  grade?: string;
  niveauEtudeId?: string;
}

/**
 * Wizard d'inscription (1ère inscription) — refonte PHASE par PHASE.
 *
 *  PHASE 1 : choix du parcours (cycle) → grade → filière (arborescence)
 *  PHASE 2 : choix de session + documents requis de la session + bordereau
 *            (la soumission constitue la demande d'autorisation provisoire)
 *  PHASE 3 : saisie manuelle des infos personnelles (l'étudiant complète et
 *            corrige lui-même le formulaire, éventuellement pré-rempli depuis
 *            les informations déjà enregistrées à son profil)
 *  ÉTAPE 4 : récapitulatif + soumission
 *  ÉTAPE 5 : statut d'inscription. Seules les étapes qui concernent l'étudiant
 *            sont affichées (« Demande envoyée » puis « Dossier validé ») ; la
 *            chaîne interne de traitement (authentification/Audit, saisie
 *            comptable, comité) reste pilotée côté back-office mais n'est pas
 *            exposée à l'étudiant.
 */
@Component({
  selector: 'app-inscription-wizard-page',
  templateUrl: './inscription-wizard-page.component.html',
  styleUrls: ['./inscription-wizard-page.component.scss']
})
export class InscriptionWizardPageComponent extends BaseComponentClass implements OnInit, OnDestroy {

  loading = false
  submitting = false
  errorMessage = ''
  successMessage = ''
  modeFormation: 'presentiel' | 'en_ligne' = 'presentiel'

  // Arborescence PARCOURS → GRADE → FILIÈRE
  arborescence: Array<{ type: string; grades: Array<{ grade: string; filieres: FiliereSelection[] }> }> = []
  typeChoisi = ''
  gradeChoisi = ''
  filiereChoisie?: FiliereSelection
  filiereSelectionId = ''

  // Session
  sessions: any[] = []
  sessionSelectionneeId?: number
  sessionVerrouillee = false
  sitesDisponibles: SiteUtilisateur[] = []
  sitesLoading = false
  sitesError = ''
  siteVerrouille = false
  private siteIdConfirme: number | null = null

  // Filtre transmis par la page de choix de session
  sessionIdFromRoute?: string
  niveauEtudeIdFromRoute?: string

  // Documents requis par la session (dossiers d'inscription)
  documentsRequis: Array<{ id: string; titre: string; description?: string; obligatoire?: boolean }> = []
  documents: { [cle: string]: File | null } = {}
  bordereau: File | null = null
  readonly PHOTOS_PATH = environment.MEDIAS_PATH.AUTH.PHOTOS
  photoEnregistree = false
  photoFichier = ''
  photoSelectionnee: File | null = null
  photoUploadEnCours = false
  photoErreur = ''
  photoApercu = ''
  showPhotoRequiredModal = false
  private photoApercuObjectUrl: string | null = null

  // Pièces qui avaient été sélectionnées avant un RECHARGEMENT du navigateur et
  // qui doivent être re-sélectionnées : le contenu binaire n'est pas conservé
  // (le nom d'origine l'est, pour pouvoir l'afficher à l'étudiant).
  documentsAReposer: { [cle: string]: FichierMeta } = {}
  bordereauAReposer: FichierMeta | null = null

  // Pièces DÉJÀ déposées sur le serveur pour la demande ouverte
  // (/inscription/demandes/:id) : dossierId → nom du fichier. Elles comptent
  // comme fournies sans être re-téléversées à la soumission.
  piecesServeur: Map<string, string> = new Map()

  // Infos personnelles (saisies ou reprises du profil, puis corrigées et validées)
  infos: {
    nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
    nationalite: string; contact: string; email: string; adresse: string;
    numeroPiece: string; sexe: string; typePieceIdentite: string;
    matriculeEtudiant: string;
    etablissementId?: string;
  } = {
    nom: '', prenoms: '', dateNaissance: '', lieuNaissance: '',
    nationalite: '', contact: '', email: '', adresse: '',
    numeroPiece: '', sexe: '', typePieceIdentite: '', matriculeEtudiant: '', etablissementId: ''
  }

  // Étape courante : 1..5
  etape = 1

  resultat: any = null
  private parcoursDejaRattache = false
  showSubmitConfirmationModal = false

  /** Mode correction du dossier : 'bordereau' (refus Audit/Cabinet) ou 'comite' (document(s) rejeté(s) au comité). */
  modeCorrection: 'bordereau' | 'comite' | null = null

  /** Motif de la correction demandée (bordereau refusé ou document rejeté au comité). */
  motifCorrection: string | null = null

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private demandeInscriptionService: DemandeInscriptionService,
    private parcoursChoisiService: ParcoursChoisiService,
    private bordereauService: BordereauService,
    private dossierInscriptionService: DossierInscriptionService,
    private apprenantService: ApprenantService,
    private wizardStore: InscriptionWizardStoreService,
    private toastService: ToastService,
    private authService: AuthService,
    private localStorage: LocalStorageService
  ) {
    super()
    if (!this.rolesValue.isApprenant) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.chargerSitesDisponibles()
    // Query params (filtre session / niveau) lus DANS TOUS LES CAS, y compris la
    // reprise d'une demande existante (/inscription/demandes/:id?sessionId=..).
    // Sans cela, le chemin « demande existante » chargeait l'arborescence sans
    // filtre — ou ne la chargeait pas du tout — et la liste des filières de
    // l'étape 1 restait vide.
    const queryParamMap = this.route.snapshot.queryParamMap
    this.sessionIdFromRoute = queryParamMap.get('sessionId') || undefined
    this.niveauEtudeIdFromRoute = queryParamMap.get('niveauEtudeId') || undefined

    // Demande EXISTANTE (/inscription/demandes/:id) : le serveur fait foi.
    // Sans cela, un rechargement sur une demande créée affichait un wizard
    // vierge à l'étape 1 alors que le dossier est déjà déposé côté serveur.
    const demandeId = this.route.snapshot.paramMap.get('id')
    if (demandeId) {
      this.chargerDemandeExistante(demandeId)
      return
    }

    ngOnDestroy(): void {
      if (this.photoApercuObjectUrl) {
        URL.revokeObjectURL(this.photoApercuObjectUrl)
      }
    }

    // Restauration de l'état dans deux cas :
    //  1) retour de la page profil (/parametres/profil, étape 3 redirigée) ;
    //  2) RECHARGEMENT du navigateur — l'état est relu depuis le sessionStorage,
    //     ce qui évite de perdre toute la saisie de l'étudiant.
    // Dans les deux cas l'état est restauré UNE fois, puis le chargement normal
    // de l'arborescence / des sessions reprend.
    const etat = this.wizardStore.reprendreEtat()
    if (etat) {
      this.restaurerEtat(etat)
      return
    }

    // Lecture des query params transmis par ChoisirSessionPage
    this.route.queryParams.subscribe(params => {
      this.sessionIdFromRoute = params['sessionId'] || undefined
      this.niveauEtudeIdFromRoute = params['niveauEtudeId'] || undefined
      this.loadArborescence()
      this.loadSessions()
    })
  }

  /**
   * Restaure un état sauvegardé dans le wizard-store (retour depuis le profil).
   * Puisque l'arborescence et les sessions sont déjà en mémoire, on ne recharge
   * pas le réseau : on re-synchronise uniquement les pièces et l'on se place
   * sur l'étape 4 (récapitulatif).
   */
  private restaurerEtat(etat: any): void {
    this.sessionIdFromRoute = etat.sessionIdFromRoute
    this.niveauEtudeIdFromRoute = etat.niveauEtudeIdFromRoute
    this.modeFormation = etat.modeFormation === 'en_ligne' ? 'en_ligne' : 'presentiel'
    this.typeChoisi = etat.typeChoisi || ''
    this.gradeChoisi = etat.gradeChoisi || ''
    this.filiereChoisie = etat.filiereChoisie
    this.filiereSelectionId = etat.filiereSelectionId || ''
    this.sessionSelectionneeId = etat.sessionSelectionneeId
    this.sessions = etat.sessions || []
    this.documentsRequis = etat.documentsRequis || []
    this.documents = etat.documents || {}
    this.bordereau = etat.bordereau || null
    this.infos = {
      nom: '', prenoms: '', dateNaissance: '', lieuNaissance: '',
      nationalite: '', contact: '', email: '', adresse: '',
      numeroPiece: '', sexe: '', typePieceIdentite: '',
      etablissementId: '',
      ...(etat.infos || {}),
      matriculeEtudiant: etat.infos?.matriculeEtudiant || ''
    }

    // Pièces perdues lors d'un rechargement : leur contenu n'est pas
    // restaurable, on mémorise leur nom pour l'afficher et on laisse
    // `documents`/`bordereau` vides → le dossier reste incomplet tant que
    // l'étudiant ne les a pas re-sélectionnées.
    this.documentsAReposer = etat.documentsAReposer || {}
    this.bordereauAReposer = etat.bordereauAReposer || null

    this.chargerInfosPersonnellesDepuisProfil()

    // Recharge l'arborescence pour disposer des labels (filière, grade) au récap.
    this.loadArborescence()

    // Étape de reprise : celle où l'étudiant en était (4 après le passage par la
    // page profil). Bornée à l'intervalle valide pour qu'un état corrompu ne
    // place jamais le wizard sur une étape inexistante.
    const etape = Number(etat.etape)
    this.etape = etape >= 1 && etape <= 5 ? etape : 1

    // On repart de l'état assaini (pièces vidées) : on le réécrit pour que le
    // rechargement suivant ne redemande pas des fichiers que l'étudiant vient
    // de re-sélectionner.
    this.sauvegarder()
  }

  /**
   * Reprend une demande EXISTANTE depuis le serveur (route /inscription/demandes/:id).
   * Positionne le wizard sur l'étape réelle du dossier au lieu d'un wizard vierge :
   *  - demande déjà transmise (statutPipeline) → étape 5 (suivi) ;
   *  - brouillon avec parcours choisi → étape 2 (documents), pré-rempli ;
   *  - brouillon avec toutes les pièces déposées → étape 3 (informations).
   * Les pièces déjà sur le serveur comptent comme fournies (pas de re-téléversement).
   */
  private chargerDemandeExistante(id: string): void {
    this.loading = true
    this.errorMessage = ''
    this.demandeInscriptionService.get(id).subscribe({
      next: (demande: any) => {
        this.loading = false
        if (!demande) {
          this.errorMessage = 'Demande introuvable.'
          return
        }
        this.modeFormation = demande.modeFormation === 'en_ligne' ? 'en_ligne' : 'presentiel'
        // Pièces marquées « à re-téléverser » par le comité (flag correctionDemandee).
        const piecesCorrection = new Set<string>(
          (Array.isArray(demande.dossiersDemande) ? demande.dossiersDemande : [])
            .filter((p: any) => p?.correctionDemandee)
            .map((p: any) => String(p.dossierId))
        )
        const statutPipeline = demande.statutPipeline
        // - 'rejete' sans pièce signalée    → bordereau refusé par l'Audit/Cabinet ;
        // - 'rejete' avec pièce(s) signalée(s) → dossier rejeté par le comité ;
        // - 'correction_demandee'           → correction demandée par le comité.
        const estCorrectionBordereau = statutPipeline === 'rejete' && piecesCorrection.size === 0
        const estCorrectionComite = statutPipeline === 'correction_demandee'
          || (statutPipeline === 'rejete' && piecesCorrection.size > 0)
        const estCorrection = estCorrectionBordereau || estCorrectionComite

        if (statutPipeline && !estCorrection) {
          // Dossier déjà transmis : suivi, pas de nouvelle saisie.
          this.resultat = { statutPipeline }
          this.successMessage = 'Votre demande a déjà été soumise et reste consultable dans votre historique.'
          this.etape = 5
          this.sauvegarder()
          return
        }

        // ── Mode correction ──
        // L'étudiant ne refait NI la filière (étape 1) NI les informations
        // personnelles (étape 3) : il est placé directement à l'étape 2 où il
        // re-téléverse UNIQUEMENT ce qui a été rejeté — le bordereau pour
        // l'Audit, les document(s) signalé(s) pour le comité — puis soumet à
        // nouveau (étape 4). Aucune resaisie : infos reprises du profil.
        if (estCorrection) {
          this.modeCorrection = estCorrectionBordereau ? 'bordereau' : 'comite'
          this.motifCorrection = demande.motifPipeline || 'Motif non précisé par le service.'
          this.documents = {}
          this.bordereau = null
          this.documentsAReposer = {}
          this.bordereauAReposer = null
          this.errorMessage = ''
          this.successMessage = ''
        }

        // Brouillon / correction : pré-remplit depuis le serveur.
        this.sessionSelectionneeId = demande.sessionId != null ? Number(demande.sessionId) : undefined
        this.sessionVerrouillee = this.sessionSelectionneeId != null
        const choix = Array.isArray(demande.parcoursChoisis)
          ? demande.parcoursChoisis.find((p: any) => p.choixFinal === true || p.choixFinal === 1) || demande.parcoursChoisis[0]
          : null
        if (choix?.parcours) {
          this.parcoursDejaRattache = true
          this.filiereChoisie = {
            id: String(choix.parcoursId ?? choix.parcours?.id ?? ''),
            titre: choix.parcours?.titre || '',
            type: choix.parcours?.type,
          } as any
          this.filiereSelectionId = String(choix.parcoursId ?? choix.parcours?.id ?? '')
          this.typeChoisi = choix.parcours?.type || ''
        }
        const requis = Array.isArray(demande.session?.dossiersInscription)
          ? demande.session.dossiersInscription
          : []
        this.documentsRequis = requis.map((d: any) => ({
          id: String(d.id),
          titre: d.titre || 'Document',
          description: d.description,
          obligatoire: d.obligatoire,
        }))
        this.piecesServeur = new Map(
          (Array.isArray(demande.dossiersDemande) ? demande.dossiersDemande : [])
            .filter((p: any) => p?.dossierId != null)
            .map((p: any) => [String(p.dossierId), p.nomFichier || 'Déposé'])
        )

        // Correction : on retire du « déjà déposé » ce qui doit être re-téléversé.
        //  - bordereau (Audit) : la pièce bordereau ne compte plus comme déposée ;
        //  - comité : seules les pièces signalées (correctionDemandee) sont
        //    retirées, le bordereau déjà authentifié reste déposé.
        if (estCorrectionBordereau) {
          const bordereauRequis = this.documentsRequis.find((d) => this.estBordereau(d))
          if (bordereauRequis) {
            const nom = this.piecesServeur.get(String(bordereauRequis.id))
            this.piecesServeur.delete(String(bordereauRequis.id))
            this.documentsAReposer[String(bordereauRequis.id)] = { nom: nom || 'bordereau refusé', taille: 0, type: '' }
          }
        } else if (estCorrectionComite) {
          for (const [cle, nom] of this.piecesServeur) {
            if (piecesCorrection.has(cle)) {
              this.piecesServeur.delete(cle)
              this.documentsAReposer[cle] = { nom, taille: 0, type: '' }
            }
          }
        }

        const obligatoires = this.documentsRequis.filter((d) => d.obligatoire !== false)
        const toutDepose = obligatoires.length > 0
          && obligatoires.every((d) => this.piecesServeur.has(String(d.id)))
        this.etape = estCorrection ? 2 : (toutDepose ? 3 : (choix ? 2 : 1))

        // Brouillon NON soumis : le serveur ne connaît encore NI le parcours NI
        // les documents (envoyés seulement à la soumission finale, étape 4). Le
        // calcul ci-dessus retomberait donc sur l'étape 1 après un F5 ou un retour
        // de la page profil. On reprend l'étape sauvegardée localement (store)
        // pour ce brouillon, en ne faisant foi du serveur que pour un dossier
        // réellement transmis ou en correction.
        if (!statutPipeline && !estCorrection) {
          const etatSauve = this.wizardStore.getEtat()
          if (etatSauve) {
            if (etatSauve.etape >= 1 && etatSauve.etape <= 5) {
              this.etape = Math.max(this.etape, etatSauve.etape)
            }
            this.documents = etatSauve.documents || this.documents
            this.documentsAReposer = etatSauve.documentsAReposer || this.documentsAReposer
            this.bordereauAReposer = etatSauve.bordereauAReposer || this.bordereauAReposer
            if (etatSauve.infos) {
              this.infos = { ...this.infos, ...etatSauve.infos }
            }
            if (etatSauve.documentsRequis?.length && this.documentsRequis.length === 0) {
              this.documentsRequis = etatSauve.documentsRequis
            }
            // La filière n'est PAS connue du serveur tant que le dossier est un
            // brouillon (le parcours est créé seulement à la soumission). On la
            // réhydrate donc depuis le store, comme le fait `restaurerEtat` ;
            // sinon le récapitulatif (et la soumission) restent sans parcours.
            if (!this.filiereChoisie && etatSauve.filiereChoisie) {
              this.filiereChoisie = etatSauve.filiereChoisie as any
              this.filiereSelectionId = etatSauve.filiereSelectionId || ''
              this.typeChoisi = etatSauve.typeChoisi || this.typeChoisi
              this.gradeChoisi = etatSauve.gradeChoisi || this.gradeChoisi
            }
          }
        }

        // Étape 1 (brouillon SANS parcours choisi) : la liste des filières est le
        // SEUL moyen de poursuivre. On charge donc l'arborescence ici, sinon le
        // <select> « Filière » reste vide et l'étudiant ne peut pas avancer.
        if (this.etape === 1) {
          this.loadArborescence()
        }
        this.loadSessions()
        this.sauvegarder()
        this.chargerInfosPersonnellesDepuisProfil(demande)
      },
      error: (err) => {
        this.loading = false
        this.errorMessage = err?.error?.message || 'Impossible de charger cette demande.'
      }
    })
  }

  private chargerInfosPersonnellesDepuisProfil(demande?: any): void {
    this.apprenantService.get().subscribe({
      next: (a: any) => {
        if (!a) {
          this.errorMessage = 'Les informations personnelles n’ont pas pu être chargées.'
          return
        }

        this.photoEnregistree = !!a.photo
        this.photoFichier = a.photo || ''

        const valeursActuelles = { ...this.infos }
        const sourceDateNaissance = a.dateNaissance ? String(a.dateNaissance).split('T')[0] : ''

        this.infos = {
          ...valeursActuelles,
          nom: valeursActuelles.nom || a.utilisateur?.nom || '',
          prenoms: valeursActuelles.prenoms || a.utilisateur?.prenoms || '',
          dateNaissance: valeursActuelles.dateNaissance || sourceDateNaissance || '',
          lieuNaissance: valeursActuelles.lieuNaissance || a.lieuNaissance || '',
          nationalite: valeursActuelles.nationalite || a.nationalite || a.identite?.nationalite || '',
          contact: valeursActuelles.contact || a.utilisateur?.contact || a.adresse?.telMobile || '',
          email: valeursActuelles.email || a.utilisateur?.email || '',
          adresse: valeursActuelles.adresse || a.adresse?.ville || '',
          numeroPiece: valeursActuelles.numeroPiece || a.numeroPiece || '',
          sexe: valeursActuelles.sexe || a.sexe || '',
          typePieceIdentite: valeursActuelles.typePieceIdentite || a.typePieceIdentite || '',
          matriculeEtudiant: valeursActuelles.matriculeEtudiant
            || demande?.matriculeEtudiant
            || a.matriculeEtudiant
            || '',
          etablissementId: valeursActuelles.etablissementId
            || (demande?.etablissementId ? String(demande.etablissementId) : '')
        }
        this.siteIdConfirme = Number(this.infos.etablissementId) || null
        this.sauvegarder()
      },
      error: () => {
        this.errorMessage = 'Les données personnelles enregistrées n’ont pas pu être chargées pour le récapitulatif.'
      }
    })
  }

  /**
   * Persiste l'état courant dans le store (sessionStorage) afin de survivre à un
   * rechargement du navigateur. Appelé après CHAQUE modification significative :
   * c'est la garantie « l'étudiant ne perd jamais sa saisie ».
   */
  sauvegarder(): void {
    this.wizardStore.sauvegarderEtat({
      etape: this.etape,
      sessionIdFromRoute: this.sessionIdFromRoute,
      niveauEtudeIdFromRoute: this.niveauEtudeIdFromRoute,
      modeFormation: this.modeFormation,
      typeChoisi: this.typeChoisi,
      gradeChoisi: this.gradeChoisi,
      filiereChoisie: this.filiereChoisie ?? null,
      filiereSelectionId: this.filiereSelectionId,
      sessionSelectionneeId: this.sessionSelectionneeId,
      sessions: this.sessions,
      documentsRequis: this.documentsRequis,
      documents: this.documents,
      bordereau: this.bordereau,
      infos: { ...this.infos }
    })
  }

  /** Vrai si des pièces restent à re-sélectionner (rechargement du navigateur). */
  get aPiecesAReposer(): boolean {
    return Object.keys(this.documentsAReposer).length > 0 || !!this.bordereauAReposer
  }

  /** Libellés lisibles des pièces à re-sélectionner, pour le message d'aide. */
  get libellesPiecesAReposer(): string[] {
    const libelles: string[] = []
    for (const cle of Object.keys(this.documentsAReposer)) {
      const titre = this.documentsRequis.find((d) => d.id === cle)?.titre
      libelles.push(titre || this.documentsAReposer[cle].nom)
    }
    if (this.bordereauAReposer) {
      const titreBordereau = this.documentsRequis.find((d) => this.estBordereau(d))?.titre
      libelles.push(titreBordereau || this.bordereauAReposer.nom)
    }
    return libelles
  }


  // ---------------------------------------------------------------------------
  // PHASE 1 — Parcours → Grade → Filière
  // ---------------------------------------------------------------------------

  loadArborescence(): void {
    this.loading = true
    // Si un sessionId ou niveauEtudeId est transmis via la route, on filtre
    // l'arborescence pour n'afficher que les filières du cycle correspondant.
    const params: any = {}
    if (this.sessionIdFromRoute) params.sessionId = this.sessionIdFromRoute
    else if (this.niveauEtudeIdFromRoute) params.niveauEtudeId = this.niveauEtudeIdFromRoute

    this.parcoursService.getArborescence(params).subscribe({
      next: (res: any) => {
        this.arborescence = res?.data || []
        this.autoSelectSiUnSeul()
        this.loading = false
      },
      error: (err) => {
        console.error('Erreur arborescence parcours:', err)
        this.loading = false
        this.errorMessage = 'Impossible de charger les parcours, grades et filières.'
      }
    })
  }

  /**
   * Auto-sélectionne le type et le grade quand il n'y en a qu'un seul,
   * pour afficher directement les filières sans clic inutile.
   * Cas typique :wizard ouvert avec ?niveauEtudeId=3 → 1 type (LICENCE),
   * 1 grade (Licence 3) → affiche directement la liste des 37 filières.
   */
  private autoSelectSiUnSeul(): void {
    if (this.arborescence.length === 1) {
      this.typeChoisi = this.arborescence[0].type
      if (this.arborescence[0].grades.length === 1) {
        this.gradeChoisi = this.arborescence[0].grades[0].grade
      }
    }
  }

  get typesDisponibles(): Array<{ type: string; grades: any[] }> {
    return this.arborescence
  }

  get gradesDisponibles(): Array<{ grade: string; filieres: FiliereSelection[] }> {
    const t = this.arborescence.find((x) => x.type === this.typeChoisi)
    return t?.grades || []
  }

  get filieresDisponibles(): FiliereSelection[] {
    const g = this.gradesDisponibles.find((x) => x.grade === this.gradeChoisi)
    return g?.filieres || []
  }

  get phase1Complete(): boolean {
    return this.modeFormation === 'en_ligne'
      || (!!this.typeChoisi && !!this.gradeChoisi && !!this.filiereChoisie)
  }

  changerModeFormation(mode: 'presentiel' | 'en_ligne'): void {
    this.modeFormation = mode
    this.errorMessage = ''
    this.sauvegarder()
  }

  choisirType(type: string): void {
    this.typeChoisi = type
    this.gradeChoisi = ''
    this.filiereChoisie = undefined
    this.sauvegarder()
  }

  choisirGrade(grade: string): void {
    this.gradeChoisi = grade
    this.filiereChoisie = undefined
    this.sauvegarder()
  }

  choisirFiliere(f: FiliereSelection): void {
    this.filiereChoisie = f
    this.sauvegarder()
  }

  /**
   * Retourne les filières d'un type donné (tous grades confondus) pour le dropdown.
   */
  getFilieresPourType(t: { type: string; grades: Array<{ grade: string; filieres: FiliereSelection[] }> }): FiliereSelection[] {
    const filieres: FiliereSelection[] = []
    for (const g of t.grades) {
      filieres.push(...g.filieres)
    }
    return filieres
  }

  /**
   * Appelé quand l'étudiant choisit une filière dans le <select> natif.
   * Reçoit directement l'id de la filière via `filiereSelectionId`
   * (lié par [(ngModel)]), puis auto-détermine type et grade.
   */
  surSelectionFiliere(): void {
    if (!this.filiereSelectionId) {
      this.filiereChoisie = undefined
      this.typeChoisi = ''
      this.gradeChoisi = ''
      this.sauvegarder()
      return
    }
    for (const t of this.arborescence) {
      for (const g of t.grades) {
        const f = g.filieres.find((x) => String(x.id) === String(this.filiereSelectionId))
        if (f) {
          this.filiereChoisie = f
          this.typeChoisi = t.type
          this.gradeChoisi = g.grade
          this.sauvegarder()
          return
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE 2 — Session + documents + bordereau
  // ---------------------------------------------------------------------------

  loadSessions(): void {
    this.sessionService.getAll().subscribe({
      next: (sessions: any) => {
        this.sessions = Array.isArray(sessions) ? sessions : []
        // L'identifiant porté par une demande existante fait foi. Le paramètre
        // sessionId de l'URL ne doit pas remplacer sa session pendant le chargement.
        // IMPORTANT : on ne charge PAS les documents ici car loadArborescence()
        // est lancé en parallèle et this.gradeChoisi est potentiellement encore
        // vide. Charger les documents avec un grade vide ferait appel à
        // getByNiveau('') → pas de filtre WHERE niveau → tous les documents
        // de la table seraient retournés (150 lignes, tous niveaux).
        // Le chargement des documents est délégué à passerEtape2() qui est
        // appelé APRÈS que la filière (et donc le grade) ait été choisi.
        const demandeExistanteId = this.route.snapshot.paramMap.get('id')
        if (!demandeExistanteId && this.sessionIdFromRoute && !this.sessionSelectionneeId) {
          const sessionAuto = this.sessions.find((s) => String(s.id) === String(this.sessionIdFromRoute))
          if (sessionAuto) {
            this.sessionSelectionneeId = Number(sessionAuto.id)
          }
        }
        this.synchroniserSiteDepuisSession()
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les sessions d\'inscription.'
      }
    })
  }

  /**
   * Charge les documents requis pour une session donnée (documents de session uniquement).
   * Les dossiers d'inscription ne sont inclus QUE par l'endpoint détail
   * (GET /sessions/:id), pas par la liste — on appelle donc le détail.
   */
  private chargerDocumentsSession(session: any): void {
    const dossiersSession: Array<{ id: string; titre: string; description?: string; obligatoire?: boolean }> =
      (session?.dossiersInscription || []).map((d: any) => ({
        id: String(d.id),
        titre: d.titre,
        description: d.description,
        obligatoire: true
      }))
    this.documents = {}
    this.documentsRequis = dossiersSession
    // Nouvelle session ⇒ les pièces de la précédente ne sont plus attendues.
    this.documentsAReposer = {}
    this.bordereauAReposer = null
  }

  /** Recharge le détail de la session pour récupérer ses dossiers d'inscription. */
  private chargerDocumentsSessionParId(sessionId: number): void {
    this.sessionService.get(String(sessionId)).subscribe({
      next: (session: any) => {
        this.chargerDocumentsSession(session)
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les documents de la session sélectionnée.'
      }
    })
  }

  surChoixSession(event: any): void {
    const id = event?.target?.value
    if (!id) return
    this.sessionSelectionneeId = Number(id)
    // Documents définis à la CRÉATION de la session (système en place),
    // disponibles uniquement via le détail de la session.
    this.chargerDocumentsSessionParId(Number(id))
    this.sauvegarder()
  }

  surDocument(cle: string, event: any): void {
    const file: File = event?.target?.files?.[0]
    if (file) {
      // Contrôle miroir du filtre serveur (DossierInscriptionRouter) : sans cela,
      // un format refusé n'est signalé qu'après l'envoi, et l'étudiant voit
      // « L'un des documents n'a pas pu être téléversé » sans savoir pourquoi.
      const extensionsAutorisees = ['.pdf', '.jpg', '.jpeg', '.png']
      const extension = ('.' + (file.name.split('.').pop() || '')).toLowerCase()
      if (!extensionsAutorisees.includes(extension)) {
        this.toastService.error(
          'Formats acceptés : PDF, JPG, JPEG ou PNG. '
          + `Le fichier « ${file.name} » a été refusé.`)
        // Réinitialise le champ pour permettre une nouvelle sélection du même fichier.
        if (event?.target) { event.target.value = '' }
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        this.toastService.error(
          `Le fichier « ${file.name} » dépasse la taille maximale de 20 Mo.`)
        if (event?.target) { event.target.value = '' }
        return
      }

      this.documents[cle] = file
      // La pièce est de nouveau disponible : on retire l'alerte de re-sélection.
      delete this.documentsAReposer[cle]
      const requis = this.documentsRequis.find((d) => d.id === cle)
      if (requis && this.estBordereau(requis)) {
        this.bordereau = file
        this.bordereauAReposer = null
      }
      this.sauvegarder()
    }
  }

  nomDocument(cle: string): string {
    return this.documents[cle]?.name || ''
  }

  /** Nom à afficher : fichier local, sinon pièce déjà déposée sur le serveur. */
  nomDocumentAffiche(cle: string): string {
    return this.nomDocument(cle) || this.piecesServeur.get(String(cle)) || ''
  }

  get documentsComplets(): boolean {
    return this.documentsRequis.every(
      (d) => !!this.documents[d.id] || this.piecesServeur.has(String(d.id))
    )
  }

  /** Vrai si la session exige un document de type bordereau. */
  get aBordereauRequis(): boolean {
    return this.documentsRequis.some((d) => this.estBordereau(d))
  }

  get bordereauPret(): boolean {
    return !this.aBordereauRequis || !!this.bordereau
  }

  /** Libellé lisible de la session sélectionnée pour le récapitulatif. */
  get sessionRecapLabel(): string {
    const s = this.sessions.find((x) => String(x.id) === String(this.sessionSelectionneeId))
    if (!s) return String(this.sessionSelectionneeId)
    const debut = s.dateDebut ? new Date(s.dateDebut).toLocaleDateString('fr-FR') : '?'
    const fin = s.dateFin ? new Date(s.dateFin).toLocaleDateString('fr-FR') : '?'
    return `du ${debut} au ${fin}`
  }

  /** Un document est le bordereau de paiement si son intitulé contient « bordereau ». */
  estBordereau(d: { id: string; titre: string }): boolean {
    return /bordereau/i.test(d.titre)
  }

  // ---------------------------------------------------------------------------
  // PHASE 3 — Infos personnelles (saisie manuelle + correction)
  // ---------------------------------------------------------------------------

  /**
   * Sauvegarde l'état du wizard puis redirige vers la page de profil complète
   * (/parametres/profil) où l'étudiant saisit la TOTALITÉ des champs.
   */
  private redirecterVersProfil(): void {
    // Sauvegarde de l'état du wizard (documents incl.) pour restauration au retour.
    this.wizardStore.sauvegarderEtat({
      etape: 4,
      sessionIdFromRoute: this.sessionIdFromRoute,
      niveauEtudeIdFromRoute: this.niveauEtudeIdFromRoute,
      typeChoisi: this.typeChoisi,
      gradeChoisi: this.gradeChoisi,
      filiereChoisie: this.filiereChoisie ?? null,
      filiereSelectionId: this.filiereSelectionId,
      sessionSelectionneeId: this.sessionSelectionneeId,
      sessions: this.sessions,
      documentsRequis: this.documentsRequis,
      documents: this.documents,
      bordereau: this.bordereau,
      infos: { ...this.infos }
    })

    // Chemin de retour vers le wizard (étape 4 = récapitulatif).
    const id = this.route.snapshot.paramMap.get('id')
    const retour = id ? `/inscription/demandes/${id}` : '/inscription/demandes'

    this.router.navigate(['/parametres/profil'], {
      queryParams: { retour }
    })
  }

  get infosCompletes(): boolean {
    return !!(
      this.infos.nom
      && this.infos.prenoms
      && this.infos.dateNaissance
      && this.infos.numeroPiece
      && this.infos.matriculeEtudiant?.trim()
      && this.siteSelectionValide
    )
  }

  surSelectionPhoto(event: Event): void {
    const input = event.target as HTMLInputElement
    const photo = input.files?.[0]
    if (!photo) return

    const typesAutorises = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!typesAutorises.includes(photo.type) || photo.size > 5 * 1024 * 1024) {
      this.photoSelectionnee = null
      this.photoErreur = 'Choisissez une image JPG, PNG, GIF ou WEBP de 5 Mo maximum.'
      input.value = ''
      return
    }

    this.photoSelectionnee = photo
    this.photoErreur = ''
    this.showPhotoRequiredModal = false
    input.value = ''
    if (this.photoApercuObjectUrl) {
      URL.revokeObjectURL(this.photoApercuObjectUrl)
    }
    this.photoApercuObjectUrl = URL.createObjectURL(photo)
    this.photoApercu = this.photoApercuObjectUrl
    this.photoUploadEnCours = true

    this.apprenantService.updatePhoto(photo).subscribe({
      next: (resultat: any) => {
        this.photoUploadEnCours = false
        this.photoSelectionnee = null
        if (!resultat?.success) {
          this.photoErreur = 'La photo n’a pas pu être enregistrée. Réessayez.'
          return
        }

        this.photoEnregistree = true
        this.photoFichier = ''
        this.photoErreur = ''
        this.toastService.success('Votre photo a été téléversée avec succès.')
      },
      error: (err) => {
        this.photoUploadEnCours = false
        this.photoSelectionnee = null
        this.photoErreur = err?.error?.message || 'La photo n’a pas pu être enregistrée. Réessayez.'
      }
    })
  }

  private chargerSitesDisponibles(): void {
    this.sitesLoading = true
    this.sitesError = ''
    this.authService.getSitesMoi().subscribe({
      next: sites => {
        this.sitesDisponibles = sites
        this.sitesLoading = false
        this.synchroniserSiteDepuisSession()
      },
      error: () => {
        this.sitesDisponibles = []
        this.sitesLoading = false
        this.sitesError = 'Les sites auxquels vous avez accès ne peuvent pas être chargés. Réessayez.'
      }
    })
  }

  private synchroniserSiteDepuisSession(): void {
    const siteId = Number(this.infos.etablissementId)
    const siteDisponible = Number.isSafeInteger(siteId)
      && siteId > 0
      && this.sitesDisponibles.some(site => Number(site.id) === siteId)

    if (!siteDisponible) {
      this.siteVerrouille = false
      this.siteIdConfirme = null
      return
    }

    this.siteVerrouille = this.siteIdConfirme != null && Number(this.siteIdConfirme) === siteId
  }

  get siteSelectionValide(): boolean {
    const siteId = Number(this.infos.etablissementId)
    if (!Number.isSafeInteger(siteId) || siteId <= 0) return false
    const siteAccessible = this.sitesDisponibles.some(site => Number(site.id) === siteId)
    if (!siteAccessible) return false
    if (!this.sessionSelectionneeId) return false
    return this.sessions.some(item => Number(item.id) === Number(this.sessionSelectionneeId))
  }

  get sessionsDuSite(): any[] {
    return this.sessions
  }

  surChoixSite(): void {
    if (this.siteVerrouille) return
    const siteId = Number(this.infos.etablissementId)
    if (!Number.isSafeInteger(siteId) || siteId <= 0) {
      this.infos.etablissementId = this.siteIdConfirme ? String(this.siteIdConfirme) : ''
      return
    }
    if (siteId === this.siteIdConfirme) return
    const nomSite = this.sitesDisponibles.find(site => Number(site.id) === siteId)?.nom || 'ce site'
    if (!window.confirm(`Confirmez-vous le choix du site « ${nomSite} » pour votre inscription ?`)) {
      this.infos.etablissementId = this.siteIdConfirme ? String(this.siteIdConfirme) : ''
      return
    }

    this.sessionSelectionneeId = undefined
    this.documentsRequis = []
    this.documents = {}
    this.bordereau = null
    this.documentsAReposer = {}
    this.bordereauAReposer = null
    this.errorMessage = ''
    this.sitesError = ''
    this.activerSiteSelectionne(siteId)
  }

  private activerSiteSelectionne(siteId: number): void {
    this.authService.definirSiteActif(siteId).subscribe({
      next: response => {
        if (!response.accessToken) {
          this.sitesError = 'Le site choisi n’a pas pu être activé.'
          return
        }
        this.localStorage.set(LocalStorageService.AUTH_TOKEN, response.accessToken)
        this.siteVerrouille = true
        this.siteIdConfirme = siteId
        this.sitesError = ''
        this.sauvegarder()
      },
      error: err => {
        this.infos.etablissementId = this.siteIdConfirme ? String(this.siteIdConfirme) : ''
        this.sitesError = err?.error?.message || 'Le site choisi n’a pas pu être affecté à votre compte.'
      }
    })
  }

  rechoisirSite(): void {
    this.siteVerrouille = false
    this.siteIdConfirme = null
    this.infos.etablissementId = ''
    this.sessionSelectionneeId = undefined
    this.sessionVerrouillee = false
    this.documentsRequis = []
    this.documents = {}
    this.bordereau = null
    this.documentsAReposer = {}
    this.bordereauAReposer = null
    this.errorMessage = ''
    this.sitesError = ''
    this.sauvegarder()
  }

  nomSiteSelectionne(): string {
    const site = this.sitesDisponibles.find(item => Number(item.id) === Number(this.infos.etablissementId))
    return site?.nom || ''
  }

  // ---------------------------------------------------------------------------
  // Navigation entre étapes
  // ---------------------------------------------------------------------------

  largeurProgression(): number {
    return Math.round((this.etape / 5) * 100)
  }

  /**
   * Stepper à icônes (même rendu visuel que l'ancien wizard via app-custom-wizard),
   * mais adapté à la logique PHASE par PHASE du nouveau parcours.
   * Chaque étape est débloquée uniquement si la précédente est remplie.
   */
  get wizardItems(): WizardItemType[] {
    const icones = [
      // 1. Parcours — casquette (cycle → grade → filière)
      'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443',
      // 2. Documents — document-texte
      'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
      // 3. Informations — utilisateur
      'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
      // 4. Récapitulatif — presse-papiers
      'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
      // 5. Statut — drapeau
      'M3 3v1.5M21 3v1.5M1.5 18.75h21M3 18.75v-9A2.25 2.25 0 015.25 7.5h13.5A2.25 2.25 0 0121 9.75v9M6 12h.008v.008H6V12zm3 0h.008v.008H9V12zm3 0h.008v.008H12V12zm3 0h.008v.008H15V12zm3 0h.008v.008H18V12z'
    ]
    const libelles = ['Filière', 'Documents', 'Informations', 'Récapitulatif', 'Statut']

    // Étape remplie si on la dépasse et que son contenu est valide.
    const etapes: Array<{ remplie: boolean }> = [
      { remplie: this.phase1Complete && this.etape > 1 },
      { remplie: this.sessionSelectionneeId != null && this.documentsComplets && this.bordereauPret && this.etape > 2 },
      { remplie: this.infosCompletes && this.etape > 3 },
      { remplie: this.etape > 4 },
      { remplie: this.statutInscription === 'effectuee' }
    ]

    return libelles.map((texte, i) => {
      const index = i + 1
      return {
        text: texte,
        icon: icones[i],
        condition: etapes[i].remplie,
        incomplete: false,
        isBlocked: (this.demandeVerrouillee && index < 5)
          || !(index === 1 || etapes[index - 2].remplie),
        action: () => this.revenirEtape(index)
      }
    })
  }

  passerEtape2(): void {
    if (!this.phase1Complete) {
      this.errorMessage = 'Veuillez choisir un parcours, un grade et une filière.'
      return
    }
    this.errorMessage = ''
    this.etape = 2
    this.sauvegarder()
    // Si une session est déjà sélectionnée (auto-depuis la route), recharger
    // les documents requis pour cette session avec le grade maintenant choisi.
    if (this.sessionSelectionneeId && this.documentsRequis.length === 0) {
      this.chargerDocumentsSessionParId(this.sessionSelectionneeId)
    }
  }

  passerEtape3(): void {
    if (!this.sessionSelectionneeId) {
      this.errorMessage = 'Veuillez choisir une session d\'inscription.'
      return
    }
    if (!this.documentsComplets) {
      this.errorMessage = 'Veuillez fournir tous les documents requis de la session.'
      return
    }
    if (!this.bordereauPret) {
      this.errorMessage = 'Veuillez téléverser le bordereau de paiement.'
      return
    }
    this.errorMessage = ''
    this.synchroniserSiteDepuisSession()
    this.redirecterVersProfil()
  }

  passerEtape4(): void {
    if (this.photoUploadEnCours) return
    if (!this.photoEnregistree && !this.photoSelectionnee) {
      this.showPhotoRequiredModal = true
      return
    }

    this.continuerApresValidationPhoto()
  }

  fermerAlertePhotoEtChoisir(): void {
    this.showPhotoRequiredModal = false
    if (typeof document !== 'undefined') {
      document.getElementById('inscription-photo')?.click()
    }
  }

  private continuerApresValidationPhoto(): void {
    this.synchroniserSiteDepuisSession()
    if (!this.siteSelectionValide) {
      this.errorMessage = 'Choisissez un site auquel vous êtes affecté et une session de ce site.'
      return
    }
    if (!this.infosCompletes) {
      this.errorMessage = 'Veuillez compléter et valider le formulaire d\'informations personnelles.'
      return
    }
    this.errorMessage = ''
    this.etape = 4
    this.sauvegarder()
  }

  /**
   * Mode correction : après re-téléversement de ce qui a été rejeté (le
   * bordereau pour l'Audit, les documents signalés pour le comité), passage
   * DIRECT au récapitulatif — ni resaisie des informations personnelles.
   */
  passerEtape4DepuisCorrection(): void {
    if (!this.documentsComplets) {
      this.errorMessage = this.modeCorrection === 'comite'
        ? 'Veuillez re-téléverser les documents signalés par le comité.'
        : 'Veuillez re-téléverser le bordereau de paiement refusé.'
      return
    }
    // En mode comité, le bordereau déjà authentifié reste « déposé » : il n'est
    // ni re-sélectionné ni re-téléversé. En mode bordereau, il est requis.
    if (this.modeCorrection === 'bordereau' && !this.bordereauPret) {
      this.errorMessage = 'Veuillez téléverser le bordereau de paiement.'
      return
    }
    this.errorMessage = ''
    this.etape = 4
    this.sauvegarder()
  }

  /** Note sous le selecteur de session en mode correction. */
  get libelleCorrectionNote(): string {
    if (this.modeCorrection === 'comite') {
      return `Correction du dossier ${this.sessionRecapLabel} : seuls les documents signalés par le comité sont à re-téléverser.`
    }
    return `Correction du dossier ${this.sessionRecapLabel} : seul le bordereau de paiement est à re-téléverser.`
  }

  revenirEtape(etape: number): void {
    if (this.demandeVerrouillee) return
    this.etape = etape
    this.sauvegarder()
  }

  // ---------------------------------------------------------------------------
  // Soumission + statut
  // ---------------------------------------------------------------------------

  /**
   * Soumission du dossier = demande d'autorisation provisoire d'inscription.
   * NOTE : le chargement du bordereau suit ici le même parcours déjà établi
   * (pipeline Audit → Service Recouvrement → Comité).
   *
   * On réutilise les endpoints existants de la 1ère inscription (non-régression) :
   *   1) POST /demandes-inscription            → crée la demande (demande d'autorisation)
   *   2) POST /parcours-choisis                 → rattache le parcours (filière) choisi
   */
  confirmerSoumission(): void {
    this.showSubmitConfirmationModal = false
    this.envoyerSoumission()
  }

  ouvrirConfirmationSoumission(): void {
    if (this.submitting || this.demandeVerrouillee) return
    this.errorMessage = ''

    if (!this.modeCorrection && !this.infos.matriculeEtudiant.trim()) {
      this.errorMessage = 'Veuillez saisir votre matricule étudiant dans vos informations personnelles.'
      return
    }

    if (!this.sessionSelectionneeId || (this.modeFormation === 'presentiel' && !this.filiereChoisie)) {
      this.errorMessage = this.modeFormation === 'en_ligne'
        ? 'Veuillez choisir une session d’inscription.'
        : 'Session ou filière manquante.'
      return
    }

    this.showSubmitConfirmationModal = true
  }

  fermerConfirmationSoumission(): void {
    this.showSubmitConfirmationModal = false
  }

  private envoyerSoumission(): void {
    if (this.submitting || this.demandeVerrouillee) return
    this.errorMessage = ''

    if (!this.modeCorrection && !this.infos.matriculeEtudiant.trim()) {
      this.errorMessage = 'Veuillez saisir votre matricule étudiant dans vos informations personnelles.'
      return
    }

    this.submitting = true

    if (!this.sessionSelectionneeId || (this.modeFormation === 'presentiel' && !this.filiereChoisie)) {
      this.submitting = false
      this.errorMessage = this.modeFormation === 'en_ligne'
        ? 'Veuillez choisir une session d’inscription.'
        : 'Session ou filière manquante.'
      return
    }

    // La demande a pu être créée en amont (page de choix de session), qui
    // redirige ensuite vers ce wizard avec son id. Dans ce cas on rattachera les
    // pièces à CETTE demande : en créer une seconde est refusé par le backend
    // (alreadySignUp) et laissait l'étudiant bloqué avec un faux « dossier soumis ».
    const demandeExistanteId = this.route.snapshot.paramMap.get('id')
    if (demandeExistanteId) {
      // En correction, la demande ET le parcours existent déjà : rejouer le
      // rattachement créerait un doublon de choix de parcours. On téléverse
      // directement les pièces re-téléversées.
      if (this.modeCorrection) {
        this.finaliserFichiers(demandeExistanteId)
        return
      }
      if (this.modeFormation === 'en_ligne') {
        this.demandeInscriptionService.updateModeFormation(demandeExistanteId, this.modeFormation).subscribe({
          next: () => this.finaliserFichiers(demandeExistanteId),
          error: err => this.echouerSoumission(err?.error?.message || 'Le mode e-learning de la demande n’a pas pu être enregistré.')
        })
        return
      }
      this.rattacherParcoursEtFinaliser(demandeExistanteId)
      return
    }

    const demande = new DemandeInscription()
    demande.sessionId = String(this.sessionSelectionneeId)
    demande.etablissementId = Number(this.infos.etablissementId)
    demande.dateDemande = new Date()
    demande.typeDemande = 'inscription'
    demande.modeFormation = this.modeFormation

    this.demandeInscriptionService.create(demande).subscribe({
      next: (demandeCreee) => {
        const demandeId = String(demandeCreee.id || (demandeCreee as any).id)
        if (this.modeFormation === 'en_ligne') this.finaliserFichiers(demandeId)
        else this.rattacherParcoursEtFinaliser(demandeId)
      },
      error: (err) => {
        this.submitting = false
        if (err?.error?.alreadySignUp) {
          // Le dossier n'a PAS été transmis : on ne passe pas à l'étape 5.
          // L'étudiant doit reprendre sa demande depuis « Mes demandes ».
          this.errorMessage = 'Une demande d\'inscription existe déjà pour cette session. Ouvrez-la depuis « Mes demandes » pour la compléter.'
        } else {
          this.toastService.error(err?.error?.message || 'Erreur lors de la soumission du dossier.')
          this.errorMessage = err?.error?.message || 'Erreur lors de la soumission du dossier.'
        }
      }
    })
  }

  /**
   * Rattache le parcours choisi à la demande puis téléverse les pièces.
   * Chemin commun à la création d'une demande neuve et à la reprise d'une
   * demande déjà créée (page de choix de session).
   */
  private rattacherParcoursEtFinaliser(demandeId: string): void {
    const parcoursChoisi = new ParcoursChoisi()
    parcoursChoisi.parcoursId = String(this.filiereChoisie!.id)
    parcoursChoisi.demandeInscriptionId = demandeId
    parcoursChoisi.choixFinal = true

    if (this.parcoursDejaRattache) {
      this.finaliserFichiers(demandeId)
      return
    }

    this.parcoursChoisiService.create(parcoursChoisi).subscribe({
      next: () => {
        this.parcoursDejaRattache = true
        this.finaliserFichiers(demandeId)
      },
      error: (err) => {
        // Dossier NON transmis : on ne saute pas à l'étape « réussi ».
        this.echouerSoumission(err?.error?.message || 'La demande a été créée mais le parcours n\'a pas pu être rattaché.')
      }
    })
  }

  recommencer(): void {
    if (this.demandeVerrouillee) return
    this.showSubmitConfirmationModal = false
    // Repartir d'une demande neuve : on efface aussi la saisie persistée,
    // pour ne pas ressusciter un ancien brouillon au prochain rechargement.
    this.wizardStore.effacer()
    this.etape = 1
    this.resultat = null
    this.typeChoisi = ''
    this.gradeChoisi = ''
    this.filiereChoisie = undefined
    this.parcoursDejaRattache = false
    this.sessionSelectionneeId = undefined
    this.documentsRequis = []
    this.documents = {}
    this.bordereau = null
    this.documentsAReposer = {}
    this.bordereauAReposer = null
    this.modeCorrection = null
    this.motifCorrection = null
    this.errorMessage = ''
    this.successMessage = ''
    this.modeFormation = 'presentiel'
  }

  private finaliserSoumission(demandeId: string, statutPipeline?: string): void {
    if (!this.modeCorrection) {
      this.demandeInscriptionService.soumettre(demandeId, this.infos.matriculeEtudiant.trim()).subscribe({
        next: (reponse) => this.afficherSoumissionFinalisee(reponse.statutPipeline),
        error: (err) => this.echouerSoumission(
          err?.error?.message || 'La demande n\'a pas pu être soumise. Veuillez réessayer.'
        )
      })
      return
    }

    this.afficherSoumissionFinalisee(statutPipeline)
  }

  private afficherSoumissionFinalisee(statutPipeline?: string): void {
    this.submitting = false
    this.showSubmitConfirmationModal = false
    // En correction comité, le backend renvoie le statut réel du dossier
    // ('transmis_comite' une fois toutes les pièces signalées re-téléversées) :
    // on l'affiche tel quel au lieu de forcer « soumis ».
    this.resultat = { statutPipeline: statutPipeline || 'soumis' }
    this.modeCorrection = null
    this.motifCorrection = null
    this.successMessage = 'Dossier soumis. Vous serez notifié de l\'avancement de votre inscription.'
    this.etape = 5
    // Dossier transmis : la sauvegarde locale n'a plus lieu d'être. Les PII et
    // les pièces de l'étudiant disparaissent du navigateur dès la soumission.
    this.wizardStore.effacer()
  }

  /** Arrête la soumission en cas d'échec d'upload (plus d'erreur silencieuse). */
  private echouerSoumission(message: string): void {
    this.submitting = false
    this.errorMessage = message
  }

  /**
   * Téléverse les documents de session (pièces requises) puis le bordereau,
   * rattachés à la demande d'inscription passée en paramètre.
   * Le bordereau suit le pipeline Audit → Service Recouvrement → Comité (BordereauService).
   * En cas d'échec d'un téléversement, on arrête (pas de continuation silencieuse
   * ni de « dossier soumis » abusif).
   * L'enrôlement facial Hikvision est systématique et géré côté backend à la
   * validation du dossier : aucun consentement n'est requis à la soumission.
   */
  private finaliserFichiers(demandeId: string): void {
    this.televerserFichiers(demandeId)
  }

  private televerserFichiers(demandeId: string): void {
    const dossierDocs: Array<{ dossierId: string; fichier: File }> = []
    let bordereauFichier: File | null = null
    // Statut renvoyé par le dernier téléversement de document (correction comité :
    // le backend réintègre le dossier au comité une fois la dernière pièce posée).
    let dernierStatut: string | null = null
    for (const requis of this.documentsRequis) {
      const fichier = this.documents[requis.id]
      if (!fichier) continue
      // Tout document requis (bordereau inclus) doit être rattaché à la demande
      // (ins_dossiers_demandes) pour satisfaire la garde de saisie ESA-COMPTA.
      dossierDocs.push({ dossierId: requis.id, fichier })
      // Le bordereau est EN PLUS envoyé au pipeline comptable (ins_bordereaux).
      if (this.estBordereau(requis)) {
        bordereauFichier = fichier
      }
    }

    const televerserSuivant = (index: number): void => {
      if (index >= dossierDocs.length) {
        this.televerserBordereau(bordereauFichier, dernierStatut, demandeId)
        return
      }
      const item = dossierDocs[index]
      this.dossierInscriptionService.uploadMultiple(demandeId, item.dossierId, [item.fichier]).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            const body: any = event.body
            if (body && typeof body.statutPipeline === 'string') {
              dernierStatut = body.statutPipeline
            }
            televerserSuivant(index + 1)
          }
        },
        error: () => this.echouerSoumission('L\'un des documents n\'a pas pu être téléversé. Veuillez réessayer.')
      })
    }

    televerserSuivant(0)
  }

  private televerserBordereau(fichier: File | null, dernierStatut: string | null | undefined, demandeId: string): void {
    if (!fichier) {
      // Aucun bordereau re-téléversé (correction comité) : on conserve le statut
      // renvoyé par le dernier téléversement de document (ex. 'transmis_comite').
      this.finaliserSoumission(demandeId, dernierStatut || undefined)
      return
    }
    const formData = new FormData()
    formData.append('fichier', fichier)
    formData.append('type', 'inscription')
    formData.append('demandeId', demandeId)
    this.bordereauService.upload(formData).subscribe({
      next: () => this.finaliserSoumission(demandeId),
      error: () => this.echouerSoumission('Le bordereau de paiement n\'a pas pu être téléversé. Veuillez réessayer.')
    })
  }

  versReinscription(): void {
    this.router.navigate(['/inscription/reinscription/wizard'])
  }

  // ---------------------------------------------------------------------------
  // Helpers d'affichage
  // ---------------------------------------------------------------------------

  /** Étape de la dernière étape : inscription effectuée ou correction demandée. */
  get statutInscription(): 'en_attente' | 'effectuee' | 'correction' {
    const statut = this.resultat?.statutPipeline
    if (statut === 'valide') return 'effectuee'
    if (statut === 'correction_demandee' || statut === 'rejete') return 'correction'
    return 'en_attente'
  }

  get demandeVerrouillee(): boolean {
    const statut = this.resultat?.statutPipeline
    return !!statut && statut !== 'rejete' && statut !== 'correction_demandee'
  }

  /**
   * Timeline affichée à l'étudiant.
   *
   * On n'y expose QUE ses propres étapes. La chaîne interne de traitement
   * (authentification / Audit, saisie comptable, passage en comité) est
   * conservée côté back-office et continue de piloter le dossier, mais elle
   * n'apporte rien à l'étudiant : la montrer le rend anxieux et l'oblige à
   * interpréter un vocabulaire administratif qui n'est pas le sien.
   */
  statutsPipeline(): Array<{ key: string; label: string; active: boolean; done: boolean; kind: string }> {
    const statut = this.resultat?.statutPipeline || 'soumis'
    const enCorrection = statut === 'correction_demandee' || statut === 'rejete'
    const valide = statut === 'valide'
    return [
      { key: 'soumis', label: 'Demande envoyée', active: !valide, done: valide, kind: 'ok' },
      {
        key: 'valide',
        label: enCorrection ? 'Correction demandée' : 'Dossier validé',
        active: !valide,
        done: false,
        kind: enCorrection ? 'warning' : 'ok'
      }
    ]
  }
}
