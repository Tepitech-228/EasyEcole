import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Quorum, VoteComite, MembreComite } from './comite-validation.service';
export { Quorum, VoteComite, MembreComite };

export interface RattrapageComiteDemande {
  id?: number;
  statutDemande?: string;
  motifRejet?: string | null;
  motifEtudiant?: string | null;
  creneauSouhaite?: string | null;
  periode?: string | null;
  dateValidationComite?: string | null;
  rattrapageSessionId?: number;
  demandePar?: number;
  utilisateur?: any;
  rattrapageSession?: any;
  documentsDeposes?: any[];
  documentsRequis?: any[];
  quorum?: Quorum;
  votes?: VoteComite[];
  membres?: MembreComite[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface DetailDemandeResponse {
  demande: RattrapageComiteDemande;
  quorum: Quorum;
  votes: VoteComite[];
  membres: MembreComite[];
}

export interface DeciderResponse {
  demandeId: number;
  decision: string;
  statutDemande: string;
  quorum: Quorum;
}

@Injectable({
  providedIn: 'root'
})
export class RattrapageComiteService {

  private readonly SERVICE_URL = `${environment.API_MODULES.INSCRIPTION}/rattrapage-comite/demandes`
  private readonly WORKFLOW_URL = `${environment.API_MODULES.INSCRIPTION}/rattrapage-workflow`

  constructor(private httpClient: HttpClient) { }

  /** GET /rattrapage-comite/demandes — liste des demandes avec quorum et votes. */
  listerDemandes(): Observable<{ data: RattrapageComiteDemande[] }> {
    return this.httpClient.get<{ data: RattrapageComiteDemande[] }>(this.SERVICE_URL)
  }

  /** GET /rattrapage-comite/demandes/:id — détail d'une demande avec quorum, votes et membres. */
  detailDemande(id: number): Observable<{ data: DetailDemandeResponse }> {
    return this.httpClient.get<{ data: DetailDemandeResponse }>(`${this.SERVICE_URL}/${id}`)
  }

  /** POST /rattrapage-comite/demandes/:id/decider — enregistrer un vote (valide / correction_demandee / rejete). */
  decider(id: number, decision: 'valide' | 'correction_demandee' | 'rejete', motif?: string): Observable<{ data: DeciderResponse }> {
    return this.httpClient.post<{ data: DeciderResponse }>(`${this.SERVICE_URL}/${id}/decider`, { decision, motif })
  }

  /** GET /rattrapage-comite/demandes/:id/votes — lister les votes d'une demande. */
  listerVotes(id: number): Observable<{ data: VoteComite[] }> {
    return this.httpClient.get<{ data: VoteComite[] }>(`${this.SERVICE_URL}/${id}/votes`)
  }

  /**
   * GET /rattrapage-workflow/demandes/:id/documents/:documentDeposeId/telecharger
   * Téléchargement d'une pièce justificative (BLOB).
   */
  telechargerDocument(demandeId: number, documentDeposeId: number): Observable<Blob> {
    return this.httpClient.get(`${this.WORKFLOW_URL}/demandes/${demandeId}/documents/${documentDeposeId}/telecharger`, { responseType: 'blob' })
  }
}
