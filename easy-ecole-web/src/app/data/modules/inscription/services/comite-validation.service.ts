import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Quorum {
  totalMembres: number
  votesCount: number
  valides: number
  restants: number
  aVote: boolean
  estUnanime: boolean
  estRejete: boolean
}

export interface VoteComite {
  membreId?: number
  decision: 'valide' | 'correction_demandee' | 'rejete' | null
  motif?: string | null
  dateVote?: string | null
}

export interface MembreComite {
  id?: number
  nom?: string
  prenoms?: string
  identifiant?: string
  email?: string
  vote: VoteComite | null
}

export interface DossierComite {
  id?: number
  statutPipeline?: string | null
  motifPipeline?: string | null
  utilisateurId?: number
  utilisateur?: any
  session?: any
  parcoursChoisis?: any[]
  dossiersDemande?: any[]
  cours?: any[]
  preInscription?: any
  reponseInscription?: any
  bordereaux?: any[]
  dossierEtudiant?: any | null
  echeances?: any[]
  quorum?: Quorum
  votes?: VoteComite[]
  membres?: MembreComite[]
}

@Injectable({
  providedIn: 'root'
})
export class ComiteValidationService {

  private readonly SERVICE_URL = `${environment.API_MODULES.INSCRIPTION}/comite-validations`

  constructor(private httpClient: HttpClient) { }

  listerDossiers(tous: boolean = false): Observable<{ data: DossierComite[] }> {
    return this.httpClient.get<{ data: DossierComite[] }>(`${this.SERVICE_URL}/dossiers`, {
      params: tous ? { tous: 'true' } : {}
    })
  }

  detailDossier(id: number | string): Observable<{ data: DossierComite }> {
    return this.httpClient.get<{ data: DossierComite }>(`${this.SERVICE_URL}/dossiers/${id}`)
  }

  decider(id: number | string, decision: 'valide' | 'correction_demandee' | 'rejete', motif?: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/dossiers/${id}/decider`, { decision, motif })
  }
}
