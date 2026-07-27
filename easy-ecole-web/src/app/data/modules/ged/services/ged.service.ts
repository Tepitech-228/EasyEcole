import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

export interface GedDocument {
  id: string;
  titre: string;
  reference?: string;
  eleve?: string;
  parcours?: string;
  categorie?: string;
  tags?: string;
  nommage?: string;
  type?: string;
  statut?: string;
  fichier: string;
  taille?: string;
  dureeConservation?: string;
  archivedUntil?: string;
  isArchived?: boolean;
  folderId?: number;
  uploaderId?: string;
  uploader?: { id: string; nom: string; prenoms: string };
  metadata?: any;
  nbPages?: number;
  auteur?: string;
  dateDocument?: string;

  domainId?: number;
  documentTypeId?: number;
  classificationPath?: string;
  sourceType?: string;
  externalIssuer?: string;
  destinataire?: string;
  receptionDate?: string;
  confidentialityLevel?: string;
  lifecycleStatus?: string;
  duaEndDate?: string;
  integrityHash?: string;
  versionMajor?: number;
  versionMinor?: number;
  versionComment?: string;
  parentDocumentId?: number;
  isCurrentVersion?: boolean;
  isLocked?: boolean;
  lockedBy?: number;
  lockedAt?: string;
  anneeAcademiqueId?: number;
  parcoursId?: number;
  niveauEtudeId?: number;
  semestre?: string;
  classeId?: number;
  salleId?: number;
  cursusApprenantId?: number;
  inscriptionDossierId?: number;
  bulletinId?: number;
  bordereauId?: number;

  processusGenerateurId?: string;
  processusGenerateur?: { id: string; code: string; libelle: string };
  storageLocation?: string;
  isEncrypted?: boolean;
  encryptionKeyId?: string;

  domain?: { id: number; code: string; label: string };
  documentType?: { id: number; code: string; shortCode: string; label: string; defaultConfidentiality: string };
  versions?: GedDocument[];

  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProcessusGenerateur {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  moduleSource?: string;
  isActif: boolean;
}

export interface GedDomain {
  id: number;
  code: string;
  label: string;
}

export interface GedDocumentType {
  id: number;
  domainId: number;
  code: string;
  shortCode: string;
  label: string;
  defaultConfidentiality: string;
  duaDurationYears?: number;
  isPermanent?: boolean;
  domain?: GedDomain;
}

export interface PaginatedResponse {
  data: GedDocument[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GedAuditLog {
  id: string;
  action: string;
  utilisateur?: { id: string; nom: string; prenoms: string };
  createdAt?: Date;
  details?: string;
}

export interface DisposalRecord {
  id: string;
  document?: GedDocument;
  motif?: string;
  demandeur?: { id: string; nom: string; prenoms: string };
  createdAt?: Date;
  statut?: string;
}

export interface GedPermission {
  id: number;
  role: string;
  roleId?: number;
  processId?: number;
  process?: { code: string; libelle: string };
  domaineId?: number;
  domaine?: { code: string; label: string };
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export interface GedProcessus {
  id: number;
  code: string;
  libelle: string;
  description?: string;
  moduleSource?: string;
  actif: boolean;
}

export interface StorageConfig {
  localPath?: string;
  localUsed?: string;
  localTotal?: string;
  nasUrl?: string;
  nasUsername?: string;
  nasPassword?: string;
  cloudProvider?: string;
  cloudCredentials?: string;
  cloudBucket?: string;
  encryptionAlgorithm?: string;
  keyRotationDays?: number;
}

export interface BackupRecord {
  id: string;
  filename?: string;
  taille?: string;
  statut?: string;
  createdAt?: string;
}

export interface GedSession {
  id: number;
  nom: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  folderId?: number;
  categorie?: string;
  status?: string;
  fields?: string[];
  participantIds?: Array<string | number>;
  creator?: { id: string | number; nom: string; prenoms: string };
  documents?: GedDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GedService {
  private readonly BASE = `${environment.API_MODULES.GED || (environment.API_MODULES as any).SCOLARITE?.replace?.('/scolarite', '/ged') || environment.API_URL + '/ged'}`;
  private readonly SERVICE_URL: string = `${this.BASE}/documents`;
  private readonly FOLDER_URL: string = `${this.BASE}/folders`;
  private readonly SESSION_URL: string = `${this.BASE}/sessions`;
  private readonly ADMIN_URL: string = `${this.BASE}/admin`;

  constructor(private httpClient: HttpClient, private localStorage: LocalStorageService) { }

  getAll(params?: { statut?: string; folderId?: number; q?: string }): Observable<GedDocument[]> {
    let url = `${this.SERVICE_URL}`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.statut) qs.set('statut', params.statut);
      if (params.folderId) qs.set('folderId', String(params.folderId));
      if (params.q) qs.set('q', params.q);
      const qStr = qs.toString();
      if (qStr) url += '?' + qStr;
    }
    return this.httpClient.get<GedDocument[]>(url);
  }

  getAllPaginated(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    domainId?: number;
    documentTypeId?: number;
    processusGenerateurId?: string;
    storageLocation?: string;
    confidentialityLevel?: string;
    lifecycleStatus?: string;
    anneeAcademiqueId?: number;
    parcoursId?: number;
    niveauEtudeId?: number;
    semestre?: string;
    classeId?: number;
    sourceType?: string;
    dateCreationFrom?: string;
    dateCreationTo?: string;
    folderId?: number;
    sessionId?: string;
    duaApproaching?: boolean;
    duaExpired?: boolean;
    sortField?: string;
    sortDirection?: string;
  } = {}): Observable<PaginatedResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.pageSize) httpParams = httpParams.set('pageSize', String(params.pageSize));
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.domainId) httpParams = httpParams.set('domainId', String(params.domainId));
    if (params.documentTypeId) httpParams = httpParams.set('documentTypeId', String(params.documentTypeId));
    if (params.confidentialityLevel) httpParams = httpParams.set('confidentialityLevel', params.confidentialityLevel);
    if (params.lifecycleStatus) httpParams = httpParams.set('lifecycleStatus', params.lifecycleStatus);
    if (params.anneeAcademiqueId) httpParams = httpParams.set('anneeAcademiqueId', String(params.anneeAcademiqueId));
    if (params.parcoursId) httpParams = httpParams.set('parcoursId', String(params.parcoursId));
    if (params.niveauEtudeId) httpParams = httpParams.set('niveauEtudeId', String(params.niveauEtudeId));
    if (params.semestre) httpParams = httpParams.set('semestre', params.semestre);
    if (params.classeId) httpParams = httpParams.set('classeId', String(params.classeId));
    if (params.processusGenerateurId) httpParams = httpParams.set('processusGenerateurId', params.processusGenerateurId);
    if (params.storageLocation) httpParams = httpParams.set('storageLocation', params.storageLocation);
    if (params.sourceType) httpParams = httpParams.set('sourceType', params.sourceType);
    if (params.dateCreationFrom) httpParams = httpParams.set('dateCreationFrom', params.dateCreationFrom);
    if (params.dateCreationTo) httpParams = httpParams.set('dateCreationTo', params.dateCreationTo);
    if (params.folderId) httpParams = httpParams.set('folderId', String(params.folderId));
    if (params.sessionId) httpParams = httpParams.set('sessionId', params.sessionId);
    if (params.duaApproaching) httpParams = httpParams.set('duaApproaching', 'true');
    if (params.duaExpired) httpParams = httpParams.set('duaExpired', 'true');
    if (params.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);
    return this.httpClient.get<PaginatedResponse>(this.SERVICE_URL, { params: httpParams });
  }

  get(id: string): Observable<GedDocument> {
    return this.httpClient.get<GedDocument>(`${this.SERVICE_URL}/${id}?include=domain,documentType,versions`);
  }

  update(id: string, formData: FormData): Observable<GedDocument> {
    return this.httpClient.put<GedDocument>(`${this.SERVICE_URL}/${id}`, formData);
  }

  getFolders(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.FOLDER_URL);
  }

  getFolderChildren(parentId?: number, domainId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (parentId != null) params = params.set('parentId', String(parentId));
    if (domainId != null) params = params.set('domainId', String(domainId));
    return this.httpClient.get<any[]>(this.FOLDER_URL, { params });
  }

  createFolder(payload: { nom: string, description?: string }): Observable<any> {
    return this.httpClient.post<any>(this.FOLDER_URL, payload);
  }

  deleteFolder(id: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.FOLDER_URL}/${id}`);
  }

  upload(formData: FormData): Observable<GedDocument> {
    return this.httpClient.post<GedDocument>(`${this.SERVICE_URL}`, formData);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }

  generatePdf(id: string): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/pdf`, { responseType: 'blob' }) as Observable<Blob>;
  }

  getDownloadUrl(id: string): string {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN);
    let url = `${this.SERVICE_URL}/download/${id}`;
    if (token) url += `?token=${encodeURIComponent(token)}`;
    return url;
  }

  getSessions(): Observable<GedSession[]> {
    return this.httpClient.get<GedSession[]>(this.SESSION_URL);
  }

  getSession(id: string): Observable<GedSession> {
    return this.httpClient.get<GedSession>(`${this.SESSION_URL}/${id}`);
  }

  createSession(payload: any): Observable<GedSession> {
    return this.httpClient.post<GedSession>(this.SESSION_URL, payload);
  }

  updateSession(id: string, payload: any): Observable<GedSession> {
    return this.httpClient.put<GedSession>(`${this.SESSION_URL}/${id}`, payload);
  }

  batchUpload(sessionId: string, files: File[], metadata: Record<string, string>, folderId?: number, archivedUntil?: string, isArchived = false): Observable<GedDocument[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('fichiers', file, file.name));
    formData.append('sessionId', sessionId);
    if (folderId) formData.append('folderId', String(folderId));
    if (archivedUntil) formData.append('archivedUntil', archivedUntil);
    formData.append('isArchived', String(isArchived));
    formData.append('metadata', JSON.stringify(metadata || {}));
    return this.httpClient.post<GedDocument[]>(`${this.SESSION_URL}/batch-upload`, formData);
  }

  getAcademicTree(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.BASE}/academic-tree`);
  }

  getDomains(): Observable<GedDomain[]> {
    return this.httpClient.get<GedDomain[]>(`${this.BASE}/admin/domains`);
  }

  getDocumentTypes(domainId?: number): Observable<GedDocumentType[]> {
    let params = new HttpParams();
    if (domainId != null) params = params.set('domainId', String(domainId));
    return this.httpClient.get<GedDocumentType[]>(`${this.BASE}/admin/document-types`, { params });
  }

  validateDocument(id: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/validate`, {});
  }

  newVersion(id: string, type: string, comment: string): Observable<GedDocument> {
    return this.httpClient.post<GedDocument>(`${this.SERVICE_URL}/${id}/new-version`, { type, comment });
  }

  lockDocument(id: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/lock`, {});
  }

  unlockDocument(id: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/unlock`, {});
  }

  getProcessusGenerateurs(): Observable<ProcessusGenerateur[]> {
    return this.httpClient.get<ProcessusGenerateur[]>(`${this.BASE}/processus`);
  }

  createProcessusGenerateur(data: Partial<ProcessusGenerateur>): Observable<ProcessusGenerateur> {
    return this.httpClient.post<ProcessusGenerateur>(`${this.BASE}/processus`, data);
  }

  updateProcessusGenerateur(id: string, data: Partial<ProcessusGenerateur>): Observable<ProcessusGenerateur> {
    return this.httpClient.put<ProcessusGenerateur>(`${this.BASE}/processus/${id}`, data);
  }

  deleteProcessusGenerateur(id: string): Observable<any> {
    return this.httpClient.delete(`${this.BASE}/processus/${id}`);
  }

  verifyIntegrity(id: string): Observable<{ valid: boolean; hash: string }> {
    return this.httpClient.post<{ valid: boolean; hash: string }>(`${this.SERVICE_URL}/${id}/verify-integrity`, {});
  }

  markForDeletion(id: string, reason: string): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/${id}/mark-for-deletion`, { reason });
  }

  confirmDeletion(id: string, reason: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/confirm-deletion`, { reason });
  }

  getAuditTrail(id: string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/${id}/audit-trail`);
  }

  restoreDocument(id: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/restore`, {});
  }

  getDisposalRecords(params?: { status?: string; page?: number; pageSize?: number; search?: string }): Observable<DisposalRecord[]> {
    let url = `${this.ADMIN_URL}/disposal`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.status) qs.set('status', params.status);
      if (params.page) qs.set('page', String(params.page));
      if (params.pageSize) qs.set('pageSize', String(params.pageSize));
      if (params.search) qs.set('search', params.search);
      const qStr = qs.toString();
      if (qStr) url += '?' + qStr;
    }
    return this.httpClient.get<DisposalRecord[]>(url);
  }

  confirmDisposal(id: string): Observable<any> {
    return this.httpClient.post(`${this.ADMIN_URL}/disposal/${id}/confirm`, {});
  }

  rejectDisposal(id: string, motif?: string): Observable<any> {
    return this.httpClient.post(`${this.ADMIN_URL}/disposal/${id}/reject`, { motif });
  }

  getPermissions(params?: { role?: string; processId?: number; domaineId?: number }): Observable<GedPermission[]> {
    let httpParams = new HttpParams();
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.processId) httpParams = httpParams.set('processId', String(params.processId));
    if (params?.domaineId) httpParams = httpParams.set('domaineId', String(params.domaineId));
    return this.httpClient.get<GedPermission[]>(`${this.ADMIN_URL}/permissions`, { params: httpParams });
  }

  updatePermission(id: number, data: Partial<GedPermission>): Observable<GedPermission> {
    return this.httpClient.put<GedPermission>(`${this.ADMIN_URL}/permissions/${id}`, data);
  }

  restoreDefaultPermissions(): Observable<any> {
    return this.httpClient.post(`${this.ADMIN_URL}/permissions/defaults`, {});
  }

  bulkUpdatePermissions(data: GedPermission[]): Observable<any> {
    return this.httpClient.put(`${this.ADMIN_URL}/permissions`, data);
  }

  getProcessusList(): Observable<GedProcessus[]> {
    return this.httpClient.get<GedProcessus[]>(`${this.ADMIN_URL}/processus`);
  }

  getProcessusById(id: number): Observable<GedProcessus> {
    return this.httpClient.get<GedProcessus>(`${this.ADMIN_URL}/processus/${id}`);
  }

  createProcessus(data: Partial<GedProcessus>): Observable<GedProcessus> {
    return this.httpClient.post<GedProcessus>(`${this.ADMIN_URL}/processus`, data);
  }

  updateProcessus(id: number, data: Partial<GedProcessus>): Observable<GedProcessus> {
    return this.httpClient.put<GedProcessus>(`${this.ADMIN_URL}/processus/${id}`, data);
  }

  toggleProcessus(id: number, actif: boolean): Observable<any> {
    return this.httpClient.patch(`${this.ADMIN_URL}/processus/${id}`, { actif });
  }

  getStorageConfig(): Observable<StorageConfig> {
    return this.httpClient.get<StorageConfig>(`${this.BASE}/storage/config`);
  }

  updateStorageConfig(data: StorageConfig): Observable<StorageConfig> {
    return this.httpClient.put<StorageConfig>(`${this.BASE}/storage/config`, data);
  }

  testStorageConnection(data: { type: 'nas' | 'cloud'; url?: string; username?: string; password?: string; credentials?: string }): Observable<any> {
    return this.httpClient.post(`${this.BASE}/storage/test`, data);
  }

  listBackups(): Observable<BackupRecord[]> {
    return this.httpClient.get<BackupRecord[]>(`${this.ADMIN_URL}/backups`);
  }

  createBackup(): Observable<BackupRecord> {
    return this.httpClient.post<BackupRecord>(`${this.ADMIN_URL}/backup`, {});
  }

  restoreBackup(id: string): Observable<any> {
    return this.httpClient.post(`${this.ADMIN_URL}/backups/${id}/restore`, {});
  }

  // ── Courrier / Registre ──
  private readonly COURRIER_URL: string = `${this.BASE}/courrier`;

  getCourriers(params?: { sens?: string; annee?: number; q?: string; page?: number; pageSize?: number }): Observable<{ data: any[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.sens) httpParams = httpParams.set('sens', params.sens);
    if (params?.annee) httpParams = httpParams.set('annee', String(params.annee));
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.pageSize) httpParams = httpParams.set('pageSize', String(params.pageSize));
    return this.httpClient.get<{ data: any[]; total: number }>(this.COURRIER_URL, { params: httpParams });
  }

  getCourrier(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.COURRIER_URL}/${id}`);
  }

  createCourrier(data: any): Observable<any> {
    return this.httpClient.post<any>(this.COURRIER_URL, data);
  }

  updateCourrier(id: string, data: any): Observable<any> {
    return this.httpClient.put<any>(`${this.COURRIER_URL}/${id}`, data);
  }

  deleteCourrier(id: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.COURRIER_URL}/${id}`);
  }

  getNextCourrierNumero(sens: string): Observable<{ annee: number; nextNumero: number }> {
    return this.httpClient.get<{ annee: number; nextNumero: number }>(`${this.COURRIER_URL}/next-numero?sens=${sens}`);
  }

  exportCourrierCsv(params?: { sens?: string; annee?: number }): Observable<Blob> {
    let url = `${this.COURRIER_URL}/export-csv`;
    const qs: string[] = [];
    if (params?.sens) qs.push(`sens=${params.sens}`);
    if (params?.annee) qs.push(`annee=${params.annee}`);
    if (qs.length) url += '?' + qs.join('&');
    return this.httpClient.get(url, { responseType: 'blob' });
  }

  // ── Domain Tree ──
  getDomainTree(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.BASE}/academic-tree`);
  }

  // ── Folder Auto-generation ──
  generateAutoFolders(anneeAcademiqueId: number): Observable<any> {
    return this.httpClient.post<any>(`${this.BASE}/folders-auto/generate/${anneeAcademiqueId}`, {});
  }

  // ── Academic years ──
  getAnneesAcademiques(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${environment.API_MODULES.INSCRIPTION}/anneesAcademiques`);
  }

  // ── Batch upload enhanced (with academic metadata) ──
  batchUploadEnhanced(files: File[], metadata: Record<string, any>): Observable<any> {
    const fd = new FormData();
    files.forEach(f => fd.append('fichiers', f, f.name));
    Object.entries(metadata).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
    });
    return this.httpClient.post<any>(`${this.SERVICE_URL}/batch-upload`, fd);
  }
}
