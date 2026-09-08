import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { ParcoursChoisiService } from 'src/app/data/modules/inscription/services/parcours-choisi.service';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { OcrService } from 'src/app/data/modules/inscription/services/ocr.service';
import { ApprenantService } from 'src/app/data/modules/auth/services/apprenant.service';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { DossierInscriptionService } from 'src/app/data/modules/inscription/services/dossier-inscription.service';
import { InscriptionWizardStoreService } from 'src/app/data/modules/inscription/services/inscription-wizard-store.service';
import { WizardItemType } from 'src/app/data/types/WizardItemType';

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
 *  PHASE 3 : saisie / pré-remplissage des infos personnelles (pré-remplissage
 *            OCR branché via un service d'extraction extensible ; sans moteur
 *            configuré, un formulaire vierge à compléter est proposé)
 *  ÉTAPE 4 : récapitulatif + soumission
 *  ÉTAPE 5 : statut d'inscription (pipeline : soumis → authentifié (cabinet)
 *            → transmis comité → validé) ; en cas de correction comptable,
 *            l'étape concernée passe en orange + notification mail.
 */
@Component({
  selector: 'app-inscription-wizard-page',
  templateUrl: './inscription-wizard-page.component.html',
  styleUrls: ['./inscription-wizard-page.component.scss']
})
export class InscriptionWizardPageComponent extends BaseComponentClass implements OnInit {

  loading = false
  submitting = false
  errorMessage = ''
  successMessage = ''

  // Arborescence PARCOURS → GRADE → FILIÈRE
  arborescence: Array<{ type: string; grades: Array<{ grade: string; filieres: FiliereSelection[] }> }> = []
  typeChoisi = ''
  gradeChoisi = ''
  filiereChoisie?: FiliereSelection
  filiereSelectionId = ''

  // Session
  sessions: any[] = []
  sessionSelectionneeId?: number

  // Filtre transmis par la page de choix de session
  sessionIdFromRoute?: string
  niveauEtudeIdFromRoute?: string

  // Documents requis par la session (dossiers d'inscription)
  documentsRequis: Array<{ id: string; titre: string; description?: string; obligatoire?: boolean }> = []
  documents: { [cle: string]: File | null } = {}
  bordereau: File | null = null

  // Infos personnelles (pré-remplies par OCR, corrigées puis validées)
  infos: {
    nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
    nationalite: string; contact: string; email: string; adresse: string;
    numeroPiece: string; sexe: string; typePieceIdentite: string;
  } = {
    nom: '', prenoms: '', dateNaissance: '', lieuNaissance: '',
    nationalite: '', contact: '', email: '', adresse: '',
    numeroPiece: '', sexe: '', typePieceIdentite: ''
  }

  // Étape courante : 1..5
  etape = 1

  resultat: any = null

  // OCR/ICR : popup de progression + % de données récupérées.
  ocrEnCours: boolean = false
  ocrResultat: { pourcentage: number; nbChamps: number; totalChamps: number } | null = null

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private demandeInscriptionService: DemandeInscriptionService,
    private parcoursChoisiService: ParcoursChoisiService,
    private ocrService: OcrService,
    private bordereauService: BordereauService,
    private dossierInscriptionService: DossierInscriptionService,
    private apprenantService: ApprenantService,
    private wizardStore: InscriptionWizardStoreService
  ) {
    super()
    if (!this.rolesValue.isApprenant) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    // Restauration éventuelle de l'état sauvegardé au retour de la page profil
    // (étape 3 redirigée vers /parametres/profil). L'état est rechargé UNE fois,
    // puis on continue le chargement normal de l'arborescence / des sessions.
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
    this.typeChoisi = etat.typeChoisi || ''
    this.gradeChoisi = etat.gradeChoisi || ''
    this.filiereChoisie = etat.filiereChoisie
    this.filiereSelectionId = etat.filiereSelectionId || ''
    this.sessionSelectionneeId = etat.sessionSelectionneeId
    this.sessions = etat.sessions || []
    this.documentsRequis = etat.documentsRequis || []
    this.documents = etat.documents || {}
    this.bordereau = etat.bordereau || null
    this.infos = Object.assign({}, etat.infos)

    // Au retour de la page profil, on récupère les infos réellement ENREGISTRÉES
    // en base (le store ne contient que le pré-remplissage OCR, souvent vide).
    // On ne surcharge pas les valeurs déjà présentes dans le wizard.
    this.apprenantService.get().subscribe({
      next: (a: any) => {
        if (!a) return
        const dateNaissance = this.infos.dateNaissance || (a.dateNaissance ? new Date(a.dateNaissance).toISOString().split('T')[0] : '')
        this.infos = {
          ...this.infos,
          nom: this.infos.nom || a.utilisateur?.nom || '',
          prenoms: this.infos.prenoms || a.utilisateur?.prenoms || '',
          dateNaissance,
          lieuNaissance: this.infos.lieuNaissance || a.lieuNaissance || '',
          nationalite: this.infos.nationalite || a.identite?.nationalite || '',
          contact: this.infos.contact || a.utilisateur?.contact || '',
          email: this.infos.email || a.utilisateur?.email || '',
          adresse: this.infos.adresse || a.adresse?.ville || '',
          numeroPiece: this.infos.numeroPiece || a.numeroPiece || '',
          sexe: this.infos.sexe || a.sexe || '',
          typePieceIdentite: this.infos.typePieceIdentite || a.typePieceIdentite || ''
        }
      },
      error: () => undefined
    })

    // Recharge l'arborescence pour disposer des labels (filière, grade) au récap.
    this.loadArborescence()
    this.etape = 4
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
    return !!this.typeChoisi && !!this.gradeChoisi && !!this.filiereChoisie
  }

  choisirType(type: string): void {
    this.typeChoisi = type
    this.gradeChoisi = ''
    this.filiereChoisie = undefined
  }

  choisirGrade(grade: string): void {
    this.gradeChoisi = grade
    this.filiereChoisie = undefined
  }

  choisirFiliere(f: FiliereSelection): void {
    this.filiereChoisie = f
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
      return
    }
    for (const t of this.arborescence) {
      for (const g of t.grades) {
        const f = g.filieres.find((x) => String(x.id) === String(this.filiereSelectionId))
        if (f) {
          this.filiereChoisie = f
          this.typeChoisi = t.type
          this.gradeChoisi = g.grade
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
        // Auto-sélection de la session si transmise via la route.
        // IMPORTANT : on ne charge PAS les documents ici car loadArborescence()
        // est lancé en parallèle et this.gradeChoisi est potentiellement encore
        // vide. Charger les documents avec un grade vide ferait appel à
        // getByNiveau('') → pas de filtre WHERE niveau → tous les documents
        // de la table seraient retournés (150 lignes, tous niveaux).
        // Le chargement des documents est délégué à passerEtape2() qui est
        // appelé APRÈS que la filière (et donc le grade) ait été choisi.
        if (this.sessionIdFromRoute) {
          const sessionAuto = this.sessions.find((s) => String(s.id) === String(this.sessionIdFromRoute))
          if (sessionAuto) {
            this.sessionSelectionneeId = Number(sessionAuto.id)
          }
        }
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les sessions d\'inscription.'
      }
    })
  }

  /**
   * Charge les documents requis pour une session donnée (documents de session uniquement).
   * Utilisé lors de l'auto-sélection depuis la route.
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
  }

  surChoixSession(event: any): void {
    const id = event?.target?.value
    if (!id) return
    this.sessionSelectionneeId = Number(id)
    const session = this.sessions.find((s) => String(s.id) === String(id))
    // Documents définis à la CRÉATION de la session (système en place)
    const dossiersSession: Array<{ id: string; titre: string; description?: string; obligatoire?: boolean }> =
      (session?.dossiersInscription || []).map((d: any) => ({
        id: String(d.id),
        titre: d.titre,
        description: d.description,
        obligatoire: true
      }))
    this.documents = {}
    this.documentsRequis = dossiersSession
  }

  surDocument(cle: string, event: any): void {
    const file: File = event?.target?.files?.[0]
    if (file) {
      this.documents[cle] = file
      const requis = this.documentsRequis.find((d) => d.id === cle)
      if (requis && this.estBordereau(requis)) {
        this.bordereau = file
      }
    }
  }

  nomDocument(cle: string): string {
    return this.documents[cle]?.name || ''
  }

  get documentsComplets(): boolean {
    return this.documentsRequis.length > 0 && this.documentsRequis.every((d) => !!this.documents[d.id])
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
  private estBordereau(d: { id: string; titre: string }): boolean {
    return /bordereau/i.test(d.titre)
  }

  // ---------------------------------------------------------------------------
  // PHASE 3 — Infos personnelles (pré-remplissage OCR + correction)
  // ---------------------------------------------------------------------------

  /**
   * Branché sur le service d'extraction OCR. En l'absence du moteur configuré,
   * le backend retourne des champs vides → formulaire à compléter. Quand le
   * moteur est branché, il pré-remplit ici les champs à partir des pièces
   * déposées ; l'étudiant corrige puis valide.
   */
  lancerExtraction(): void {
    this.ocrEnCours = true
    this.ocrResultat = null
    const fichiers = this.fichiersPriorisesPourOcr()

    this.ocrService.preRemplissage(fichiers).subscribe({
      next: (res: any) => {
        const data = res?.data || {}
        this.appliquerResultatOcr(data)
        this.ocrEnCours = false
        this.ocrResultat = this.calculerResultatOcr(data)
      },
      error: () => {
        // Repli : moteur OCR indisponible → l'étudiant complète le profil lui-même.
        this.infos = this.infosVides()
        this.ocrEnCours = false
        this.ocrResultat = { pourcentage: 0, nbChamps: 0, totalChamps: this.CHAMPS_OCR_PROFIL.length }
      }
    })
  }

  /**
   * Priorise les pièces qui alimentent le plus le profil : l'acte de naissance
   * et la CNI sont traités EN PREMIER (le référentiel OCR leur accorde la
   * meilleure fiabilité / le plus de champs), puis les autres documents, puis
   * le bordereau.
   */
  private fichiersPriorisesPourOcr(): File[] {
    const fichierDe = (motif: RegExp): File | null => {
      const requis = this.documentsRequis.find((d) => motif.test(d.titre))
      return requis ? (this.documents[requis.id] || null) : null
    }
    const naissance = fichierDe(/naissance|acte|extrait/i)
    const cni = fichierDe(/cni|cin|carte.?national|carte.?identit/i)

    const autres = this.documentsRequis
      .map((d) => this.documents[d.id])
      .filter((f): f is File => !!f)
      .filter((f) => f !== naissance && f !== cni)

    const ordonnes: File[] = []
    if (naissance) ordonnes.push(naissance)
    if (cni) ordonnes.push(cni)
    ordonnes.push(...autres)
    if (this.bordereau) ordonnes.push(this.bordereau)
    return ordonnes
  }

  /** Champs du profil que l'OCR/ICR peut (re)pré-remplir. */
  private readonly CHAMPS_OCR_PROFIL = [
    'nom', 'prenoms', 'dateNaissance', 'lieuNaissance', 'sexe',
    'nationalite', 'contact', 'adresse', 'numeroPiece'
  ]

  /** Calcule le % de données récupérées par l'OCR/ICR. */
  private calculerResultatOcr(d: any): { pourcentage: number; nbChamps: number; totalChamps: number } {
    const remplis = this.CHAMPS_OCR_PROFIL.filter((c) => !!(d[c] && String(d[c]).trim())).length
    const total = this.CHAMPS_OCR_PROFIL.length
    return { pourcentage: Math.round((remplis / total) * 100), nbChamps: remplis, totalChamps: total }
  }

  /** Ferme la popup OCR et poursuit vers le profil. */
  continuerApresOcr(): void {
    this.ocrResultat = null
    this.redirecterVersProfil()
  }

  private infosVides(): { nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string; nationalite: string; contact: string; email: string; adresse: string; numeroPiece: string; sexe: string; typePieceIdentite: string } {
    return { nom: '', prenoms: '', dateNaissance: '', lieuNaissance: '', nationalite: '', contact: '', email: '', adresse: '', numeroPiece: '', sexe: '', typePieceIdentite: '' }
  }

  /** Applique le résultat OCR consolidé sur les infos du wizard. */
  private appliquerResultatOcr(d: any): void {
    this.infos = {
      nom: d.nom || '',
      prenoms: d.prenoms || '',
      dateNaissance: d.dateNaissance || '',
      lieuNaissance: d.lieuNaissance || '',
      nationalite: d.nationalite || '',
      contact: d.contact || '',
      email: d.email || '',
      adresse: d.adresse || '',
      numeroPiece: d.numeroPiece || '',
      sexe: d.sexe || '',
      typePieceIdentite: d.typePieceIdentite || ''
    }
  }

  /**
   * Sauvegarde l'état du wizard puis redirige vers la page de profil complète
   * (/parametres/profil) où l'étudiant saisit la TOTALITÉ des champs. On passe
   * le résultat OCR via le store (pas dans l'URL — pas de PII exposée).
   */
  private redirecterVersProfil(): void {
    // Conserve les infos OCR dans le store (pré-remplissage du profil).
    const ocrBrut = this.infos

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
      infos: { ...ocrBrut }
    })

    // Chemin de retour vers le wizard (étape 4 = récapitulatif).
    const id = this.route.snapshot.paramMap.get('id')
    const retour = id ? `/inscription/demandes/${id}` : '/inscription/demandes'

    // Transmet les valeurs OCR pré-remplies au profil via le store.
    this.wizardStore.ocrPreRemplissage = { ...ocrBrut }

    this.router.navigate(['/parametres/profil'], {
      queryParams: { retour }
    })
  }

  get infosCompletes(): boolean {
    return !!(this.infos.nom && this.infos.prenoms && this.infos.dateNaissance && this.infos.numeroPiece)
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
        isBlocked: !(index === 1 || etapes[index - 2].remplie),
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
    // Si une session est déjà sélectionnée (auto-depuis la route), recharger
    // les documents requis pour cette session avec le grade maintenant choisi.
    if (this.sessionSelectionneeId && this.documentsRequis.length === 0) {
      const session = this.sessions.find((s) => String(s.id) === String(this.sessionSelectionneeId))
      if (session) {
        this.chargerDocumentsSession(session)
      }
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
    this.lancerExtraction()
  }

  passerEtape4(): void {
    if (!this.infosCompletes) {
      this.errorMessage = 'Veuillez compléter et valider le formulaire d\'informations personnelles.'
      return
    }
    this.errorMessage = ''
    this.etape = 4
  }

  revenirEtape(etape: number): void {
    this.etape = etape
  }

  // ---------------------------------------------------------------------------
  // Soumission + statut
  // ---------------------------------------------------------------------------

  /**
   * Soumission du dossier = demande d'autorisation provisoire d'inscription.
   * NOTE : le chargement du bordereau suit ici le même parcours déjà établi
   * (pipeline Cabinet → ESA-Compta → Comité).
   *
   * On réutilise les endpoints existants de la 1ère inscription (non-régression) :
   *   1) POST /demandes-inscription            → crée la demande (demande d'autorisation)
   *   2) POST /parcours-choisis                 → rattache le parcours (filière) choisi
   */
  soumettre(): void {
    if (this.submitting) return
    this.submitting = true
    this.errorMessage = ''

    if (!this.sessionSelectionneeId || !this.filiereChoisie) {
      this.submitting = false
      this.errorMessage = 'Session ou filière manquante.'
      return
    }

    const demande = new DemandeInscription()
    demande.sessionId = String(this.sessionSelectionneeId)
    demande.dateDemande = new Date()
    demande.typeDemande = 'inscription'

    this.demandeInscriptionService.create(demande).subscribe({
      next: (demandeCreee) => {
        const parcoursChoisi = new ParcoursChoisi()
        parcoursChoisi.parcoursId = String(this.filiereChoisie!.id)
        parcoursChoisi.demandeInscriptionId = demandeCreee.id || (demandeCreee as any).id
        parcoursChoisi.choixFinal = true

        this.parcoursChoisiService.create(parcoursChoisi).subscribe({
          next: () => {
            this.finaliserFichiers(demandeCreee.id || (demandeCreee as any).id)
          },
          error: (err) => {
            this.submitting = false
            this.errorMessage = err?.error?.message || 'La demande a été créée mais le parcours n\'a pas pu être rattaché.'
            this.etape = 5
            this.resultat = { statutPipeline: 'soumis' }
          }
        })
      },
      error: (err) => {
        this.submitting = false
        if (err?.error?.alreadySignUp) {
          this.demandeInscriptionService.getAll().subscribe({
            next: (res) => {
              const existingDemande = res.data.find((d) => {
                const matchSession = String(d.sessionId) === String(demande.sessionId)
                const matchUser = BaseComponentClass.utilisateur?.id ? String(d.utilisateurId) === BaseComponentClass.utilisateur.id : true
                return matchSession && matchUser
              })

              if (existingDemande) {
                const parcoursChoisi = new ParcoursChoisi()
                parcoursChoisi.parcoursId = String(this.filiereChoisie!.id)
                parcoursChoisi.demandeInscriptionId = existingDemande.id!
                parcoursChoisi.choixFinal = true

                this.parcoursChoisiService.create(parcoursChoisi).subscribe({
                  next: () => {
                    this.finaliserFichiers(existingDemande.id!)
                  },
                  error: (err) => {
                    this.submitting = false
                    this.errorMessage = err?.error?.message || 'La demande a été créée mais le parcours n\'a pas pu être rattaché.'
                    this.etape = 5
                    this.resultat = { statutPipeline: 'soumis' }
                  }
                })
              } else {
                this.errorMessage = 'Vous avez déjà une demande pour cette session.'
                this.submitting = false
              }
            },
            error: () => {
              this.submitting = false
              this.errorMessage = 'Vous avez déjà une demande pour cette session.'
            }
          })
        } else {
          this.errorMessage = err?.error?.message || 'Erreur lors de la soumission du dossier.'
        }
      }
    })
  }

  recommencer(): void {
    this.etape = 1
    this.resultat = null
    this.typeChoisi = ''
    this.gradeChoisi = ''
    this.filiereChoisie = undefined
    this.sessionSelectionneeId = undefined
    this.documentsRequis = []
    this.documents = {}
    this.bordereau = null
    this.errorMessage = ''
    this.successMessage = ''
  }

  private finaliserSoumission(): void {
    this.submitting = false
    this.resultat = { statutPipeline: 'soumis' }
    this.successMessage = 'Dossier soumis. Vous serez notifié de l\'avancement de votre inscription.'
    this.etape = 5
  }

  /**
   * Téléverse les documents de session (pièces requises) puis le bordereau,
   * rattachés à la demande d'inscription passée en paramètre.
   * Le bordereau suit le pipeline Cabinet → ESA-Compta → Comité (BordereauService).
   */
  private finaliserFichiers(demandeId: string): void {
    const dossierDocs: Array<{ dossierId: string; fichier: File }> = []
    let bordereauFichier: File | null = null
    for (const requis of this.documentsRequis) {
      const fichier = this.documents[requis.id]
      if (!fichier) continue
      if (this.estBordereau(requis)) {
        bordereauFichier = fichier
      } else {
        dossierDocs.push({ dossierId: requis.id, fichier })
      }
    }

    const televerserSuivant = (index: number): void => {
      if (index >= dossierDocs.length) {
        this.televerserBordereau(bordereauFichier)
        return
      }
      const item = dossierDocs[index]
      this.dossierInscriptionService.uploadMultiple(demandeId, item.dossierId, [item.fichier]).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            televerserSuivant(index + 1)
          }
        },
        error: () => televerserSuivant(index + 1)
      })
    }

    televerserSuivant(0)
  }

  private televerserBordereau(fichier: File | null): void {
    if (!fichier) {
      this.finaliserSoumission()
      return
    }
    const formData = new FormData()
    formData.append('fichier', fichier)
    formData.append('type', 'inscription')
    this.bordereauService.upload(formData).subscribe({
      next: () => this.finaliserSoumission(),
      error: () => this.finaliserSoumission()
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

  statutsPipeline(): Array<{ key: string; label: string; active: boolean; done: boolean; kind: string }> {
    const statut = this.resultat?.statutPipeline || 'soumis'
    const steps = [
      { key: 'soumis', label: 'Soumis' },
      { key: 'authentifie', label: 'Authentifié (cabinet)' },
      { key: 'transmis_comite', label: 'Transmis au comité' },
      { key: 'valide', label: 'Validé' }
    ]
    const idx = steps.findIndex((s) => s.key === statut)
    const currentIdx = idx === -1 ? (['correction_demandee', 'rejete'].includes(statut) ? steps.length - 1 : 0) : idx
    return steps.map((s, i) => ({
      key: s.key,
      label: s.label,
      active: i === currentIdx,
      done: i < currentIdx,
      kind: statut === 'correction_demandee' && i === currentIdx ? 'warning' : (statut === 'rejete' && i === currentIdx ? 'danger' : 'ok')
    }))
  }
}
