import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  MonitoringOverview,
  SystemStats,
  DatabaseStats,
  OcrStats,
  QueueStats,
  StorageStats,
  DockerContainer,
  ErrorGroupRow,
  AlertRow,
  ApiStatRow,
  ApiDetail,
  ApiCatalogItem,
  MonitoringExportParams,
  MonitoringFilters,
} from '../models/monitoring.models';

/**
 * Service HTTP du module Monitoring.
 *
 * Chaque méthode interroge les endpoints `/api/v1/monitoring/*`.
 * Le backend n'étant pas encore disponible, chaque appel est protégé
 * par un `catchError` qui retourne une valeur par défaut typée :
 * l'UI affiche alors un état « Données indisponibles » sans casser.
 */
@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly BASE = `${environment.API_URL}/monitoring`;

  constructor(private http: HttpClient) {}

  /** Vue d'ensemble du monitoring (score global, modules, tendances). */
  getOverview(): Observable<MonitoringOverview> {
    return this.http.get<MonitoringOverview>(`${this.BASE}/overview`).pipe(
      catchError(() => of(this.emptyOverview()))
    );
  }

  /** Métriques système (CPU, RAM, réseau, etc.) pour une période. */
  getSystem(from: Date, to: Date): Observable<SystemStats> {
    const params = new HttpParams()
      .set('from', from.toISOString())
      .set('to', to.toISOString());
    return this.http.get<SystemStats>(`${this.BASE}/system`, { params }).pipe(
      catchError(() => of(this.emptySystemStats()))
    );
  }

  /** Statistiques de la base de données. */
  getDatabase(): Observable<DatabaseStats> {
    return this.http.get<DatabaseStats>(`${this.BASE}/database`).pipe(
      catchError(() => of(this.emptyDatabaseStats()))
    );
  }

  /** Statistiques OCR (extraction automatique). */
  getOcr(): Observable<OcrStats> {
    return this.http.get<OcrStats>(`${this.BASE}/ocr`).pipe(
      catchError(() => of(this.emptyOcrStats()))
    );
  }

  /** Statistiques des files d'attente. */
  getQueues(): Observable<QueueStats[]> {
    return this.http.get<QueueStats[]>(`${this.BASE}/queues`).pipe(
      catchError(() => of([]))
    );
  }

  /** Statistiques de stockage. */
  getStorage(): Observable<StorageStats> {
    return this.http.get<StorageStats>(`${this.BASE}/storage`).pipe(
      catchError(() => of(this.emptyStorageStats()))
    );
  }

  /** État des conteneurs Docker. */
  getDocker(): Observable<DockerContainer[]> {
    return this.http.get<DockerContainer[]>(`${this.BASE}/docker`).pipe(
      catchError(() => of([]))
    );
  }

  /** Groupes d'erreurs avec filtres optionnels. */
  getErrors(params: MonitoringFilters): Observable<ErrorGroupRow[]> {
    const httpParams = this.buildErrorParams(params);
    return this.http.get<ErrorGroupRow[]>(`${this.BASE}/errors`, { params: httpParams }).pipe(
      catchError(() => of([]))
    );
  }

  /** Alertes actives du système. */
  getAlerts(): Observable<AlertRow[]> {
    return this.http.get<AlertRow[]>(`${this.BASE}/alerts`).pipe(
      catchError(() => of([]))
    );
  }

  /** Liste paginée des statistiques d'API avec filtres. */
  getApis(params: MonitoringFilters): Observable<ApiStatRow[]> {
    const httpParams = this.buildApiParams(params);
    return this.http.get<ApiStatRow[]>(`${this.BASE}/apis`, { params: httpParams }).pipe(
      catchError(() => of([]))
    );
  }

  /** Détail complet d'une API par identifiant. */
  getApiDetail(id: string): Observable<ApiDetail> {
    return this.http.get<ApiDetail>(`${this.BASE}/apis/${id}`).pipe(
      catchError(() => of(this.emptyApiDetail()))
    );
  }

  /** Catalogue complet des APIs enregistrées. */
  getApiCatalog(): Observable<ApiCatalogItem[]> {
    return this.http.get<ApiCatalogItem[]>(`${this.BASE}/api-catalog`).pipe(
      catchError(() => of([]))
    );
  }

  /** Mise à jour partielle d'une entrée du catalogue d'API. */
  updateApiCatalog(id: string, patch: Partial<ApiCatalogItem>): Observable<ApiCatalogItem> {
    return this.http.put<ApiCatalogItem>(`${this.BASE}/api-catalog/${id}`, patch).pipe(
      catchError(() => of(this.emptyApiCatalogItem()))
    );
  }

  /** Export des données de monitoring vers XLSX (retourne un Blob). */
  export(params: MonitoringExportParams): Observable<Blob> {
    return this.http.post(`${this.BASE}/export`, params, { responseType: 'blob' }).pipe(
      catchError(() => of(new Blob()))
    );
  }

  // ─── Helpers : valeurs par défaut typées ──────────────────────────

  private emptyOverview(): MonitoringOverview {
    return {
      globalScore: 0,
      modules: [],
      trends: { requests: [], latency: [], errors: [] },
      positives: [],
      warnings: [],
    };
  }

  private emptySystemStats(): SystemStats {
    return {
      current: { cpu: 0, ram: 0, swap: 0, disk: 0, netIn: 0, netOut: 0, uptime: 0, loadAvg: 0 },
      history: [],
    };
  }

  private emptyDatabaseStats(): DatabaseStats {
    return {
      connectionsActive: 0,
      connectionsMax: 0,
      queriesPerSecond: 0,
      slowQueries: 0,
      avgQueryMs: 0,
      errors: 0,
      deadlocks: 0,
      dbSizeMb: 0,
      topTables: [],
    };
  }

  private emptyOcrStats(): OcrStats {
    return {
      pending: 0,
      processing: 0,
      done: 0,
      succeeded: 0,
      failed: 0,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      failureRate: 0,
      slowestDocuments: [],
    };
  }

  private emptyStorageStats(): StorageStats {
    return {
      totalMb: 0,
      usedMb: 0,
      freeMb: 0,
      usedPercent: 0,
      filesCount: 0,
      totalSizeMb: 0,
      byType: [],
      largestFiles: [],
    };
  }

  private emptyApiDetail(): ApiDetail {
    return {
      id: '',
      functionalLabel: '',
      description: '',
      category: '',
      module: '',
      route: '',
      method: '',
      enabled: true,
      statsRecent: {
        id: '', functionalLabel: '', category: '', route: '', method: '',
        requests: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0,
        errors: 0, errorRate: 0, status: 'ok',
      },
      statsPreviousPeriod: {
        id: '', functionalLabel: '', category: '', route: '', method: '',
        requests: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0,
        errors: 0, errorRate: 0, status: 'ok',
      },
      deltasPercent: { requests: 0, latencyP95: 0, errors: 0 },
      recentErrors: [],
    };
  }

  private emptyApiCatalogItem(): ApiCatalogItem {
    return {
      id: '', functionalLabel: '', description: '', category: '',
      module: '', method: '', route: '', enabled: true,
    };
  }

  // ─── Helpers : construction des HttpParams ────────────────────────

  private buildErrorParams(params: MonitoringFilters): HttpParams {
    let p = new HttpParams();
    if (params.period?.from) {
      p = p.set('from', params.period.from.toISOString());
    }
    if (params.period?.to) {
      p = p.set('to', params.period.to.toISOString());
    }
    if (params.module) {
      p = p.set('module', params.module);
    }
    if (params.category) {
      p = p.set('category', params.category);
    }
    if (params.method) {
      p = p.set('method', params.method);
    }
    if (params.errorLevel) {
      p = p.set('errorLevel', params.errorLevel);
    }
    return p;
  }

  private buildApiParams(params: MonitoringFilters): HttpParams {
    let p = new HttpParams();
    if (params.module) {
      p = p.set('module', params.module);
    }
    if (params.category) {
      p = p.set('category', params.category);
    }
    if (params.method) {
      p = p.set('method', params.method);
    }
    if (params.errorLevel) {
      p = p.set('errorLevel', params.errorLevel);
    }
    return p;
  }
}
