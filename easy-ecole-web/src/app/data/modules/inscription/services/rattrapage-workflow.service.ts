import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RattrapageInscriptionWorkflow, RattrapageSession } from '../models/RattrapageWorkflow.model';

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

  /** GET /documents-requis/:sessionId — liste des pièces d'une session. */
  getDocumentsRequis(sessionId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/documents-requis/${sessionId}`)
  }

  // ---------------------------------------------------------------------------
  // Demandes (APPRENANT : soumission + lectures ; COMITE/ADMIN/INSTITUTION/CABINET : toutes)
  // ---------------------------------------------------------------------------

  /** POST /demandes — soumet une demande de rattrapage (session ouverte, 1 demande/étudiant/session). */
  createDemande(body: { rattrapageSessionId: number; motifEtudiant?: string; creneauSouhaite?: string }): Observable<RattrapageInscriptionWorkflow> {
    return this.httpClient.post<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes`, body)
  }

  /**
   * GET /demandes
   * APPRENANT : ses demandes ; COMITE/ADMIN/INSTITUTION/CABINET_COMPTABLE : toutes (filtres query).
   * Include : documentsDeposes (avec documentRequis), documentsRequis, utilisateur, rattrapageSession, bordereauDepose.
   */
  getDemandes(params?: { statutDemande?: string; rattrapageSessionId?: number | string }): Observable<RattrapageInscriptionWorkflow[]> {
    let httpParams = new HttpParams()
    if (params) {
      if (params.statutDemande) httpParams = httpParams.set('statutDemande', params.statutDemande)
      if (params.rattrapageSessionId !== undefined && params.rattrapageSessionId !== null && params.rattrapageSessionId !== '') {
        httpParams = httpParams.set('rattrapageSessionId', String(params.rattrapageSessionId))
      }
    }
    return this.httpClient.get<RattrapageInscriptionWorkflow[]>(`${this.SERVICE_URL}/demandes`, { params: httpParams })
  }

  /** GET /demandes/:id — détail d'une demande. */
  getDemande(id: number): Observable<RattrapageInscriptionWorkflow> {
    return this.httpClient.get<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes/${id}`)
  }

  // ---------------------------------------------------------------------------
  // Actions comité (COMITE_ORIENTATION / ADMIN / INSTITUTION)
  // ---------------------------------------------------------------------------

  /** PUT /demandes/:id/valider — valide la demande de rattrapage. */
  validerDemande(id: number): Observable<RattrapageInscriptionWorkflow> {
    return this.httpClient.put<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes/${id}/valider`, {})
  }

  /** PUT /demandes/:id/rejeter — rejette la demande avec un motif obligatoire. */
  rejeterDemande(id: number, motif: string): Observable<RattrapageInscriptionWorkflow> {
    return this.httpClient.put<RattrapageInscriptionWorkflow>(`${this.SERVICE_URL}/demandes/${id}/rejeter`, { motif })
  }

  // ---------------------------------------------------------------------------
  // Dépôt de documents (APPRENANT propriétaire)
  // ---------------------------------------------------------------------------

  /**
   * POST /demandes/:id/documents — téléverse une pièce justificative.
   * Multipart : champ 'fichier' + 'documentRequisId'. Fichier PDF, 20 Mo max.
   */
  uploadDocument(demandeId: number, documentRequisId: number, fichier: File): Observable<RattrapageInscriptionWorkflow> {
    const formData: FormData = new FormData()
    formData.append('documentRequisId', String(documentRequisId))
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