/**
 * Modèles TypeScript du module Monitoring (supervision technique système).
 *
 * Ces interfaces définissent les structures de données consommées
 * par le MonitoringService et partagées avec le MonitoringStateService.
 */

// ─── Périodes de temps ───────────────────────────────────────────────────────

export type MonitoringPeriodKey = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'year' | 'custom';

export interface MonitoringPeriod {
  key: MonitoringPeriodKey;
  label: string;
  from: Date;
  to: Date;
}

// ─── État de santé ───────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'attention' | 'critical' | 'unknown';

export interface HealthModule {
  id: string;
  slug: string;
  label: string;
  status: HealthStatus;
  score: number; // 0-100
  message?: string;
}

// ─── Vue d'ensemble du monitoring ──────────────────────────────────────────

export interface TrendPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface MonitoringOverview {
  globalScore: number;
  collectedAt?: string;
  metrics?: Array<{ label: string; value: number | string; unit?: string; trend?: number; icon?: string; color?: string }>;
  modules: HealthModule[];
  trends: {
    requests: TrendPoint[];
    latency: TrendPoint[];
    errors: TrendPoint[];
  };
  positives: string[];
  warnings: string[];
}

// ─── Statistiques API ────────────────────────────────────────────────────────

export type ApiStatus = 'ok' | 'slow' | 'degraded';

export interface ApiStatRow {
  id: string;
  functionalLabel: string;
  category: string;
  route: string;
  method: string;
  requests: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  errors: number;
  errorRate: number;
  status: ApiStatus;
}

export interface ErrorGroupBrief {
  id: string;
  level: 'error' | 'warn' | 'critical';
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}

export interface ApiDetail {
  id: string;
  functionalLabel: string;
  description: string;
  category: string;
  module: string;
  route: string;
  method: string;
  enabled: boolean;
  statsRecent: ApiStatRow;
  statsPreviousPeriod: ApiStatRow;
  deltasPercent: {
    requests: number;
    latencyP95: number;
    errors: number;
  };
  recentErrors: ErrorGroupBrief[];
}

// ─── Métriques système ───────────────────────────────────────────────────────

export interface SystemMetricRow {
  timestamp: string;
  cpu: number;
  ram: number;
  swap: number;
  disk: number;
  netIn: number;
  netOut: number;
  loadAvg: number;
}

export interface SystemStats {
  current: {
    cpu: number;
    ram: number;
    swap: number;
    disk: number;
    netIn: number;
    netOut: number;
    uptime: number;
    loadAvg: number;
  };
  history: SystemMetricRow[];
}

// ─── Statistiques base de données ────────────────────────────────────────────

export interface DatabaseStats {
  connectionsActive: number;
  connectionsMax: number;
  queriesPerSecond: number;
  slowQueries: number;
  avgQueryMs: number;
  errors: number;
  deadlocks: number;
  dbSizeMb: number;
  topTables: { table: string; rows: number; sizeMb: number }[];
}

// ─── Statistiques OCR ────────────────────────────────────────────────────────

export interface OcrDocument {
  id: string;
  name: string;
  ms: number;
  status: 'succeeded' | 'failed' | 'processing';
}

export interface OcrStats {
  pending: number;
  processing: number;
  done: number;
  succeeded: number;
  failed: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  failureRate: number;
  slowestDocuments: OcrDocument[];
}

// ─── Statistiques files d'attente ────────────────────────────────────────────

export interface QueueStats {
  name: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  retries: number;
  avgMs: number;
}

// ─── Statistiques stockage ───────────────────────────────────────────────────

export interface StorageByType {
  type: string;
  sizeMb: number;
  count: number;
}

export interface LargestFile {
  name: string;
  sizeMb: number;
  path: string;
}

export interface StorageStats {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  usedPercent: number;
  filesCount: number;
  totalSizeMb: number;
  byType: StorageByType[];
  largestFiles: LargestFile[];
}

// ─── Conteneurs Docker ───────────────────────────────────────────────────────

export type DockerState = 'running' | 'exited' | 'restarting' | 'unhealthy';

export interface DockerContainer {
  name: string;
  image: string;
  state: DockerState;
  cpu: number;
  memory: number;
  netIn: number;
  netOut: number;
  restarts: number;
  uptime: number;
  health: string;
}

// ─── Groupes d'erreurs ───────────────────────────────────────────────────────

export type ErrorLevel = 'error' | 'warn' | 'critical';

export interface ErrorGroupRow {
  id: string;
  level: ErrorLevel;
  module: string;
  functionalLabel: string;
  route: string;
  httpCode: number;
  messageType: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
}

// ─── Alertes ─────────────────────────────────────────────────────────────────

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface AlertRow {
  id: string;
  type: string;
  level: AlertLevel;
  module: string;
  message: string;
  currentValue: number;
  threshold: number;
  status: string;
  resolvedAt?: string;
}

// ─── Catalogue d'APIs ────────────────────────────────────────────────────────

export interface ApiCatalogItem {
  id: string;
  functionalLabel: string;
  description: string;
  category: string;
  module: string;
  method: string;
  route: string;
  enabled: boolean;
}

// ─── Paramètres d'export ─────────────────────────────────────────────────────

export type MonitoringExportType =
  | 'all'
  | 'system'
  | 'api'
  | 'database'
  | 'ocr'
  | 'queues'
  | 'storage'
  | 'docker'
  | 'errors'
  | 'alerts';

export interface MonitoringExportParams {
  period: MonitoringPeriod;
  type: MonitoringExportType;
  format: 'xlsx';
}

// ─── Filtres de monitoring ───────────────────────────────────────────────────

export interface MonitoringFilters {
  period: MonitoringPeriod;
  module?: string;
  category?: string;
  method?: string;
  errorLevel?: string;
}
