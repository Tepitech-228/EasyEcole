import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Pointage } from '../models/Pointage.model';
import { PointageSituationFinanciere } from 'src/app/shared/models/PointageSituationFinanciere.model';

export interface PointageTerminalConfig {
  id: number;
  serialNumber: string;
  nom: string;
  sourceIp: string;
  etablissementId: number;
  actif: boolean;
  attStamp: number;
  lastSeenAt: string | null;
}

/** Réponse du serveur quand un départ doit être confirmé explicitement. */
export interface SeancePointageScan {
  action: 'debut' | 'fin';
  seanceId: number;
  cours: string;
  heureDebutPrevue: string;
  heureFinPrevue: string;
  heureDebutReelle: string;
  heureDebutEffective?: string | null;
  heureFinReelle: string | null;
  heureReelle: string;
  confirmationToken?: string;
}

export interface DepartureConfirmation {
  success: boolean;
  requiresConfirmation: true;
  mode: 'depart';
  heureDepart: string;
  confirmationToken: string;
  utilisateurId?: number;
  seancePointage?: SeancePointageScan;
}

export interface NavigationProchainCours {
  siteActuel: string;
  prochainCours: {
    site: string;
    heureDebut: string;
    salle: string | null;
    etage: string | null;
    memeSite: boolean;
  } | null;
}

export interface SeancePointageEndResponse {
  pointage: Pointage;
  navigationCours: NavigationProchainCours;
}

export type PointageScanResponse =
  | {
    success: boolean;
    mode: 'arrivee' | 'depart' | 'passage';
    pointage: Pointage;
    heureEvenement?: string;
    avertissementPaiement?: string;
    avertissementRetard?: string;
    situationFinanciere?: PointageSituationFinanciere;
    seancePointage?: SeancePointageScan;
  }
  | DepartureConfirmation;

export interface PointageExportParams {
  format: 'xlsx' | 'docx';
  debut?: string;
  fin?: string;
  role?: string;
  profils?: ('etudiants' | 'enseignants' | 'personnel')[];
  search?: string;
  statut?: string;
}

export interface HikvisionTerminalConfig {
  id: number;
  serialNumber: string;
  nom: string;
  sourceIp: string | null;
  protocol: 'hikvision_isapi';
  population: 'personnel' | 'etudiant';
  hikvisionPort: number;
  hikvisionHttps: boolean;
  username: string | null;
  etablissementId: number;
  actif: boolean;
  lastSeenAt: string | null;
  /** Vrai dès qu'un jeton a été généré (le secret lui-même n'est jamais relu). */
  hasDeviceToken?: boolean;
}

/** Réponse de création : le jeton en clair n'est renvoyé qu'une seule fois. */
export interface HikvisionTerminalCreationResult extends HikvisionTerminalConfig {
  deviceToken?: string;
}

/** Corps du PUT /hikvision-terminaux/:id (le mot de passe n'est jamais relu). */
export interface HikvisionTerminalUpdatePayload {
  serialNumber: string;
  nom: string;
  sourceIp: string;
  port: number;
  https: boolean;
  username?: string;
  password?: string;
  etablissementId: number;
  population?: 'personnel' | 'etudiant';
  actif?: boolean;
}

export interface HikvisionStaffCandidateTerminal {
  id: number;
  nom: string;
  etablissementId: number;
  statut: string;
  compteCree: boolean;
  derniereErreur: string | null;
}

export interface HikvisionStaffCandidate {
  utilisateurId: number;
  nom: string;
  prenoms: string;
  role: string;
  identifiant: string;
  employeeNo: string | null;
  photoDisponible: boolean;
  siteIds: number[];
  sites: { id: number; nom: string }[];
  terminaux: HikvisionStaffCandidateTerminal[];
  missingTerminalCount: number;
}

export interface HikvisionStudentCandidate {
  key: string;
  utilisateurId: number;
  nom: string;
  prenoms: string;
  identifiant: string;
  employeeNo: string;
  siteId: number;
  siteNom: string;
  photoDisponible: boolean;
  terminaux: HikvisionStaffCandidateTerminal[];
  missingTerminalCount: number;
}

export interface HikvisionStaffCandidatesResponse {
  utilisateurs: HikvisionStaffCandidate[];
  etudiants: HikvisionStudentCandidate[];
  sites: { id: number; nom: string }[];
}

export interface HikvisionStaffTerminalRetryResult {
  terminalId: number;
  terminalName: string;
  etablissementId: number;
  compteCree: boolean;
  statut: 'cree' | 'deja_present' | 'echec' | 'en_cours';
  message: string;
}

export interface HikvisionStaffRetryResult {
  utilisateurId: number;
  nomComplet: string;
  employeeNo: string | null;
  compteCree: boolean;
  message: string;
  terminaux: HikvisionStaffTerminalRetryResult[];
}

@Injectable({
  providedIn: 'root'
})
export class PointageService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/pointages`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Pointage[]> {
    return this.httpClient.get<Pointage[]>(`${this.SERVICE_URL}`)
  }

  getToday(): Observable<Pointage | null> {
    return this.httpClient.get<Pointage | null>(`${this.SERVICE_URL}/today`)
  }

  pointerArrivee(): Observable<Pointage> {
    return this.httpClient.post<Pointage>(`${this.SERVICE_URL}/arrivee`, {})
  }

  pointerDepart(confirmationToken?: string): Observable<Pointage | DepartureConfirmation> {
    return this.httpClient.post<Pointage | DepartureConfirmation>(
      `${this.SERVICE_URL}/depart`,
      confirmationToken ? { confirmationToken } : {}
    )
  }

  pointerArriveeByScan(userId: string): Observable<Pointage> {
    return this.httpClient.post<Pointage>(`${this.SERVICE_URL}/scan/arrivee`, { userId })
  }

  pointerDepartByScan(userId: string, confirmationToken?: string): Observable<Pointage | PointageScanResponse> {
    return this.httpClient.post<Pointage | PointageScanResponse>(
      `${this.SERVICE_URL}/scan/depart`,
      confirmationToken ? { userId, confirmationToken } : { userId }
    )
  }

  pointerFinCoursByScan(confirmationToken: string, motifDepart?: string): Observable<SeancePointageEndResponse> {
    return this.httpClient.post<SeancePointageEndResponse>(`${this.SERVICE_URL}/scan/fin-cours`, { confirmationToken, motifDepart })
  }

  pointerParQR(codeQR: string, confirmationToken?: string): Observable<PointageScanResponse> {
    return this.httpClient.post<PointageScanResponse>(
      `${this.SERVICE_URL}/scan/pointage`,
      confirmationToken ? { codeQR, confirmationToken } : { codeQR }
    )
  }

  verifierStatutByQR(codeQR: string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/scan/verifier-statut/${encodeURIComponent(codeQR)}`)
  }

  getMonQr(): Observable<{ success: boolean, qrDataUrl: string }> {
    return this.httpClient.get<{ success: boolean, qrDataUrl: string }>(`${this.SERVICE_URL}/mon-qr`)
  }

  getTerminaux(): Observable<PointageTerminalConfig[]> {
    return this.httpClient.get<PointageTerminalConfig[]>(`${this.SERVICE_URL}/terminaux`);
  }

  creerTerminal(data: Pick<PointageTerminalConfig, 'serialNumber' | 'nom' | 'sourceIp' | 'etablissementId'>): Observable<PointageTerminalConfig> {
    return this.httpClient.post<PointageTerminalConfig>(`${this.SERVICE_URL}/terminaux`, data);
  }

  modifierTerminal(id: number, data: Partial<Pick<PointageTerminalConfig, 'nom' | 'sourceIp' | 'actif'>>): Observable<PointageTerminalConfig> {
    return this.httpClient.put<PointageTerminalConfig>(`${this.SERVICE_URL}/terminaux/${id}`, data);
  }

  getTerminauxHikvision(): Observable<HikvisionTerminalConfig[]> {
    return this.httpClient.get<HikvisionTerminalConfig[]>(`${this.SERVICE_URL}/hikvision-terminaux`);
  }

  getComptesPersonnelAEnroler(): Observable<HikvisionStaffCandidatesResponse> {
    return this.httpClient.get<HikvisionStaffCandidatesResponse>(
      `${this.SERVICE_URL}/hikvision-comptes/personnel-a-relancer`
    );
  }

  relancerComptePersonnelHikvision(utilisateurId: number, etablissementId?: number): Observable<HikvisionStaffRetryResult> {
    return this.httpClient.post<HikvisionStaffRetryResult>(
      `${this.SERVICE_URL}/hikvision-comptes/personnel/${utilisateurId}/relancer`,
      etablissementId === undefined ? {} : { etablissementId }
    );
  }

  relancerCompteEtudiantHikvision(utilisateurId: number, etablissementId: number): Observable<HikvisionStaffRetryResult> {
    return this.httpClient.post<HikvisionStaffRetryResult>(
      `${this.SERVICE_URL}/hikvision-comptes/etudiants/${utilisateurId}/sites/${etablissementId}/relancer`,
      {}
    );
  }

  creerTerminalHikvision(data: {
    serialNumber: string;
    nom: string;
    sourceIp: string;
    port: number;
    https: boolean;
    username: string;
    password: string;
    etablissementId: number;
    population: 'personnel' | 'etudiant';
  }): Observable<HikvisionTerminalCreationResult> {
    return this.httpClient.post<HikvisionTerminalCreationResult>(`${this.SERVICE_URL}/hikvision-terminaux`, data);
  }

  modifierTerminalHikvision(id: number, data: HikvisionTerminalUpdatePayload): Observable<HikvisionTerminalConfig> {
    return this.httpClient.put<HikvisionTerminalConfig>(`${this.SERVICE_URL}/hikvision-terminaux/${id}`, data);
  }

  /** Génère un nouveau jeton ; l'ancien est invalidé immédiatement. */
  regenererJetonTerminalHikvision(id: number): Observable<{ success: boolean; deviceToken: string }> {
    return this.httpClient.post<{ success: boolean; deviceToken: string }>(`${this.SERVICE_URL}/hikvision-terminaux/${id}/token`, {});
  }

  testerTerminalHikvision(id: number): Observable<{ success: boolean; message: string }> {
    return this.httpClient.post<{ success: boolean; message: string }>(`${this.SERVICE_URL}/hikvision-terminaux/${id}/test`, {});
  }

  modifierEtatTerminalHikvision(id: number, actif: boolean): Observable<HikvisionTerminalConfig> {
    return this.httpClient.put<HikvisionTerminalConfig>(`${this.SERVICE_URL}/hikvision-terminaux/${id}`, { actif });
  }

  /** Supprime un terminal Hikvision. 409 si le terminal possède déjà des pointages. */
  supprimerTerminalHikvision(id: number): Observable<{ success: boolean; message: string }> {
    return this.httpClient.delete<{ success: boolean; message: string }>(`${this.SERVICE_URL}/hikvision-terminaux/${id}`);
  }

  exportPointages(params: PointageExportParams): Observable<Blob> {
    let httpParams = new HttpParams().set('format', params.format)
    if (params.debut) httpParams = httpParams.set('debut', params.debut)
    if (params.fin) httpParams = httpParams.set('fin', params.fin)
    if (params.role) httpParams = httpParams.set('role', params.role)
    if (params.profils) httpParams = httpParams.set('profils', params.profils.join(','))
    if (params.search) httpParams = httpParams.set('search', params.search)
    if (params.statut) httpParams = httpParams.set('statut', params.statut)
    return this.httpClient.get(`${this.SERVICE_URL}/export`, {
      params: httpParams,
      responseType: 'blob'
    })
  }

  getRapport(debut?: string, fin?: string): Observable<any> {
    let url = `${this.SERVICE_URL}/rapport`
    const params: string[] = []
    if (debut) params.push(`debut=${encodeURIComponent(debut)}`)
    if (fin) params.push(`fin=${encodeURIComponent(fin)}`)
    if (params.length > 0) url += '?' + params.join('&')
    return this.httpClient.get<any>(url)
  }
}
