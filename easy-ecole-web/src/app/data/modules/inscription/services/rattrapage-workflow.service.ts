import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { RattrapageInscriptionWorkflow, RattrapageSession, RattrapagePlanning, Quorum, VoteComite, MembreComite } from '../models/RattrapageWorkflow.model';

export interface DetailDemandeResponse {
  demande: RattrapageInscriptionWorkflow;
  quorum: Quorum;
  votes: VoteComite[];
  membres: MembreComite[];
}

export interface ListerVotesResponse {
  votes: VoteComite[];
  membres: MembreComite[];
  quorum: Quorum;
}

/**
 * Service front du workflow officiel de rattrapage.
 *
 * Base : `${environment.API_MODULES.INSCRIPTION}/rattrapage-workflow`
 *
 * Regroupe :
 * - la gestion des sessions de rattrapage (ADMIN/INSTITUTION),
 * - la soumission des demandes + dépôt des pièces (APPRENANT),
 * - la validation / rejet par le comité (COMITE/ADMIN/INSTITUTION),
 * - le bordereau de paiement (APPRENANT) puis la confirmation du paiement (CABINET_COMPTABLE/ADMIN).
 *
 * Les fichiers sont manipulés PAR BLOB via les endpoints dédiés, jamais en chemin brut.
 */
@Injectable({
  providedIn: 'root'
})
export class RattrapageWorkflowService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/rattrapage-workflow`

  constructor(private httpClient: HttpClient) { }

  // ---------------------------------------------------------------------------
  // Sessions de rattrapage (ADMIN / INSTITUTION)
  // ---------------------------------------------------------------------------

  /** POST /sessions — crée une session de rattrapage. */
  createSession(body: {
    libelle: string;
    dateDebut: string;
    dateFin: string;
    anneeAcademiqueId?: number;
    description?: string;
    classesId?: number[];
    documentsRequis?: { libelle: string; obligatoire?: boolean; ordre?: number }[];
  }): Observable<RattrapageSession> {
    return this.httpClient.post<RattrapageSession>(`${this.SERVICE_URL}/sessions`, body)
  }

  /** PUT /sessions/:id — met à jour une session (remplace classesId/documentsRequis si fournis). */
  updateSession(
    id: number,
    body: {
      libelle?: string;
      dateDebut?: string;
      dateFin?: string;
      anneeAcademiqueId?: number;
      description?: string;
      classesId?: number[];
      documentsRequis?: { libelle: string; obligatoire?: boolean; ordre?: number }[];
    }
  ): Observable<RattrapageSession> {
    return this.httpClient.put<RattrapageSession>(`${this.SERVICE_URL}/sessions/${id}`, body)
  }

  /** Ouvre la session (statut 'preparation' → 'ouverte'). */
  ouvrirSession(id: number): Observable<RattrapageSession> {
    return this.httpClient.put<RattrapageSession>(`${this.SERVICE_URL}/sessions/${id}`, { statut: 'ouverte' })
  }

  /** Clôture la session (statut 'ouverte' → 'cloturee'). */
  cloturerSession(id: number): Observable<RattrapageSession> {
    return this.httpClient.put<RattrapageSession>(`${this.SERVICE_URL}/sessions/${id}`, { statut: 'cloturee' })
  }

  /** GET /sessions — liste des sessions de rattrapage. */
  getSessions(): Observable<RattrapageSession[]> {
    return this.httpClient.get<RattrapageSession[]>(`${this.SERVICE_URL}/sessions`)
  }

  /** GET /sessions/:id — détail complet d'une session. */
  getSession(id: number): Observable<RattrapageSession> {
    return this.httpClient.get<RattrapageSession>(`${this.SERVICE_URL}/sessions/${id}`)
  }

  /** GET /sessions/:id/planning — liste des plannings d'une session. */
  getPlanning(sessionId: number): Observable<RattrapagePlanning[]> {
    return this.httpClient.get<RattrapagePlanning[]>(`${this.SERVICE_URL}/sessions/${sessionId}/planning`)
  }

  /** PUT /planning/:id/designer — désigne un professeur sur un planning. */
  designerProf(planningId: number, enseignantId: number): Observable<RattrapagePlanning> {
    return this.httpClient.put<RattrapagePlanning>(`${this.SERVICE_URL}/planning/${planningId}/designer`, { enseignantId })
  }

  /** GET /documents-requis/:sessionId — liste des pièces d'une session. */
  getDocumentsRequis(sessionId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/documents-requis/${sessionId}`)
  }

  /** GET /documents-requis-fixes — les 3 pièces fixes d'une demande sans session. */
  getDocumentsRequisFixes(): Observable<{ code: string; libelle: string }[]> {
    return this.httpClient.get<{ code: string; libelle: string }[]>(`${this.SERVICE_URL}/documents-requis-fixes`)
  }

  /** GET /ues-non-validees — UE déjà déclarées par l'étudiant (pré-remplissage). */
  getUesNonValidees(): Observable<{ id: string; code: string; libelle: string; sessionId: number | null; statutDemande: string }[]> {
    return this.httpClient.get<{ id: string; code: string; libelle: string; sessionId: number | null; statutDemande: string }[]>(`${this.SERVICE_URL}/ues-non-validees`)
  }

  // ---------------------------------------------------------------------------
  // Demandes (APPRENANT : soumission + lectures ; COMITE/ADMIN/INSTITUTION/CABINET : toutes)
  // ---------------------------------------------------------------------------

  /**
   * POST /demandes — soumet une demande de rattrapage.
   * Deux modes :
   *  - avec session : `rattrapageSessionId` (session ouverte, 1 demande/étudiant/session) ;
   *  - SANS session (orpheline) : `periode` + `uesDemandees` (rattachée à la session de la période à sa création).
   */
  createDemande(body: {
    rattrapageSessionId?: number;
    uesDemandees?: (string | { id?: string; code?: string; libelle?: string })[];
    periode?: string;
    motifEtudiant?: string;
    creneauSouhaite?: string;
  }): Observable<RattrapageInscriptionWorkflow> {
    return this.httpClient.post<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes`, body)
  }

  /**
   * GET /demandes
   * APPRENANT : ses demandes ; COMITE/ADMIN/INSTITUTION/CABINET_COMPTABLE : toutes (filtres query).
   * Include : documentsDeposes (avec documentRequis), documentsRequis, utilisateur, rattrapageSession, bordereauDepose.
   */
  getDemandes(params?: { statutDemande?: string; rattrapageSessionId?: number | string }): Observable<{ success: boolean; data: RattrapageInscriptionWorkflow[] }> {
    let httpParams = new HttpParams()
    if (params) {
      if (params.statutDemande) httpParams = httpParams.set('statutDemande', params.statutDemande)
      if (params.rattrapageSessionId !== undefined && params.rattrapageSessionId !== null && params.rattrapageSessionId !== '') {
        httpParams = httpParams.set('rattrapageSessionId', String(params.rattrapageSessionId))
      }
    }
    return this.httpClient.get<{ success: boolean; data: RattrapageInscriptionWorkflow[] }>(`${this.SERVICE_URL}/demandes`, { params: httpParams })
  }

  /** GET /demandes/:id — détail d'une demande avec quorum, votes et membres. */
  getDemande(id: number): Observable<DetailDemandeResponse> {
    return this.httpClient.get<{ success: boolean; data: DetailDemandeResponse }>(`${this.SERVICE_URL}/demandes/${id}`).pipe(
      map(res => res.data)
    )
  }

  // ---------------------------------------------------------------------------
  // Actions comité (COMITE_ORIENTATION / ADMIN / INSTITUTION)
  // ---------------------------------------------------------------------------

  /** PUT /demandes/:id/valider — valide la demande (enregistre vote + unanimité). */
  validerDemande(id: number): Observable<DetailDemandeResponse> {
    return this.httpClient.put<{ success: boolean; data: DetailDemandeResponse }>(`${this.SERVICE_URL}/demandes/${id}/valider`, {}).pipe(
      map(res => res.data)
    )
  }

  /** PUT /demandes/:id/rejeter — rejette avec motif (enregistre vote = veto). */
  rejeterDemande(id: number, motif: string): Observable<DetailDemandeResponse> {
    return this.httpClient.put<{ success: boolean; data: DetailDemandeResponse }>(`${this.SERVICE_URL}/demandes/${id}/rejeter`, { motif }).pipe(
      map(res => res.data)
    )
  }

  /** GET /demandes/:id/votes — lister les votes d'une demande. */
  listerVotes(id: number): Observable<ListerVotesResponse> {
    return this.httpClient.get<{ success: boolean; data: ListerVotesResponse }>(`${this.SERVICE_URL}/demandes/${id}/votes`).pipe(
      map(res => res.data)
    )
  }

  /** GET /utilisateurs/comite — membres actifs du comité (COMITE_ORIENTATION). */
  getMembresComite(): Observable<MembreComite[]> {
    return this.httpClient.get<MembreComite[]>(`${this.SERVICE_URL}/utilisateurs/comite`)
  }

  // ---------------------------------------------------------------------------
  // Dépôt de documents (APPRENANT propriétaire)
  // ---------------------------------------------------------------------------

  /**
   * POST /demandes/:id/documents — téléverse une pièce justificative.
   * Multipart : champ 'fichier' + 'documentRequisId' (demande avec session)
   *            OU champ 'fichier' + 'codeDocument' (demande SANS session → 3 pièces fixes).
   * Fichier PDF, 20 Mo max.
   */
  uploadDocument(demandeId: number, options: { documentRequisId?: number; codeDocument?: string }, fichier: File): Observable<RattrapageInscriptionWorkflow> {
    const formData: FormData = new FormData()
    if (options.documentRequisId) formData.append('documentRequisId', String(options.documentRequisId))
    if (options.codeDocument) formData.append('codeDocument', options.codeDocument)
    formData.append('fichier', fichier, fichier.name)
    return this.httpClient.post<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes/${demandeId}/documents`, formData)
  }

  /**
   * POST /demandes/:id/bordereau — téléverse le bordereau de paiement (demande 'valide').
   * Multipart : champ 'fichier' (PDF). Montant fixé côté back par le paramètre global 'frais_rattrapage'.
   */
  uploadBordereau(demandeId: number, fichier: File): Observable<RattrapageInscriptionWorkflow> {
    const formData: FormData = new FormData()
    formData.append('fichier', fichier, fichier.name)
    return this.httpClient.post<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes/${demandeId}/bordereau`, formData)
  }

  /** PUT /demandes/:id/confirmer-paiement — confirme le paiement (CABINET_COMPTABLE/ADMIN) → inscription définitive. */
  confirmerPaiement(id: number): Observable<RattrapageInscriptionWorkflow> {
    return this.httpClient.put<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes/${id}/confirmer-paiement`, {})
  }

  // ---------------------------------------------------------------------------
  // Téléchargement de fichiers (BLOB)
  // ---------------------------------------------------------------------------

  /**
   * GET /demandes/:id/documents/:documentDeposeId/telecharger
   * (propriétaire / comité / admin / compta) — retourne le blob PDF de la pièce déposée.
   */
  telechargerDocument(demandeId: number, documentDeposeId: number): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/demandes/${demandeId}/documents/${documentDeposeId}/telecharger`, { responseType: 'blob' })
  }
}