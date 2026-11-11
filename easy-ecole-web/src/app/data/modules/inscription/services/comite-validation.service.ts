import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
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
  matriculeConfirme?: string | null
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
  matricule?: string
  matriculeEtudiant?: string | null
  statutPipeline?: string | null
  motifPipeline?: string | null
  typeDemande?: string | null
  estReinscription?: boolean | null
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

export interface AutorisationApiASigner {
  id: number
  reference: string | null
  dateGeneration: string | null
  etudiant: { nom: string; prenoms: string; identifiant: string } | null
  signe: boolean
  maSignature: string | null
  signaturesRecues: Array<{ signataireId: number; signedAt: string }>
}

/** Filtres combinables du tableau des dossiers comité. */
export interface FiltresComite {
  anneeId?: string | null
  filiere?: string | null
  parcoursId?: string | null
  niveauId?: string | null
}

@Injectable({
  providedIn: 'root'
})
export class ComiteValidationService {

  private readonly SERVICE_URL = `${environment.API_MODULES.INSCRIPTION}/comite-validations`

  constructor(private httpClient: HttpClient) { }

  /**
   * Liste les dossiers du comité. Le filtrage est fait par le backend :
   * la requête est plafonnée côté serveur, donc un filtrage dans le navigateur
   * porterait sur une liste déjà tronquée et donnerait des résultats faux.
   * `meta.total` / `meta.tronque` permettent de prévenir l'utilisateur.
   */
  listerDossiers(tous: boolean = false, filtres: FiltresComite = {}): Observable<{ data: DossierComite[]; meta?: { total: number; tronque: boolean } }> {
    let params = new HttpParams()
    if (tous) params = params.set('tous', 'true')
    if (filtres.anneeId) params = params.set('anneeId', filtres.anneeId)
    if (filtres.filiere) params = params.set('filiere', filtres.filiere)
    if (filtres.parcoursId) params = params.set('parcoursId', filtres.parcoursId)
    if (filtres.niveauId) params = params.set('niveauId', filtres.niveauId)

    return this.httpClient.get<{ data: DossierComite[]; meta?: { total: number; tronque: boolean } }>(
      `${this.SERVICE_URL}/dossiers`,
      { params }
    )
  }

  detailDossier(id: number | string): Observable<{ data: DossierComite }> {
    return this.httpClient.get<{ data: DossierComite }>(`${this.SERVICE_URL}/dossiers/${id}`)
  }

  decider(
    id: number | string,
    decision: 'valide' | 'correction_demandee' | 'rejete',
    motif?: string,
    dossierIdsAReposer?: number[],
    matriculeConfirme?: string,
    matriculeEtudiant?: string,
    autorisationProvisoire?: {
      diplomeRecu: 'BAC' | 'LICENCE' | 'MASTER'
      dateDiplomeRecu: string
      relevesSemestresRecus: string[]
      relevesSemestresDates: Record<string, string>
      semestresAutorises: string[]
    },
  ): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/dossiers/${id}/decider`, {
      decision,
      motif,
      dossierIdsAReposer,
      matriculeConfirme,
      matriculeEtudiant,
      autorisationProvisoire,
    }).pipe(timeout(120_000))
  }

  /**
   * Récupère le dossier complet de l'étudiant en un seul PDF multipages
   * (pièces du wizard, bordereaux, quitus, reçus et documents délivrés).
   *
   * Téléchargement en Blob et non par lien direct : l'endpoint exige un jeton
   * d'authentification, et l'intergiciel backend n'accepte le token en query
   * string que sur une liste blanche de chemins (il fuit dans les logs).
   */
  telechargerPdfFusionne(id: number | string): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/dossiers/${id}/pdf-fusionne`, { responseType: 'blob' })
  }

  listerAutorisationsASigner(): Observable<{ data: AutorisationApiASigner[] }> {
    return this.httpClient.get<{ data: AutorisationApiASigner[] }>(`${this.SERVICE_URL}/autorisations-a-signer`)
  }

  telechargerAutorisationASigner(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/autorisations-a-signer/${id}/pdf`, { responseType: 'blob' })
  }

  signerAutorisation(id: number, signatureData: string): Observable<{ success: boolean; message: string }> {
    return this.httpClient.post<{ success: boolean; message: string }>(
      `${this.SERVICE_URL}/autorisations-a-signer/${id}/signature`,
      { signatureData },
    ).pipe(timeout(120_000))
  }
}
