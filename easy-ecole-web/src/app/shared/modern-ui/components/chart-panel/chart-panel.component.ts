import { Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';
import { ChartOptions, ChartType, ChartDataset } from 'chart.js';

/**
 * Forme du « payload » d'entrée simplifiée utilisée pour construire
 * automatiquement labels + datasets (+ couleurs) des graphiques du kit.
 *
 * @example
 *   { type: 'doughnut', labels: ['Validées', 'Rejetées'],
 *     datasets: [{ label: 'Notes', data: [12, 3] }],
 *     colors: ['#10b981', '#ef4444'] }
 */
export interface ChartPanelPayload {
  /** Type chart.js : line | area | bar | horizontalBar | doughnut. */
  type: 'line' | 'area' | 'bar' | 'horizontalBar' | 'doughnut';
  /** Libellés de l'axe X / catégories. */
  labels?: string[];
  /** Séries de données (une seule suffit pour doughnut / barres simples). */
  datasets: Array<{ label?: string; data: number[] }>;
  /** Palette de couleurs (optionnelle). */
  colors?: string[];
}

const DEFAULT_PALETTE = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];

/**
 * Carte « graphique » moderne et réutilisable pour les dashboards.
 *
 * - Brique « draggable » (carte) en Bootstrap avec header et menu d'actions.
 * - Encapsule ng2-charts (chart.js) : types line / bar / doughnut / area,
 *   y compris barres horizontales et barres de progression simples.
 * - Accepte soit l'API « explicite » (title/subtitle/chartType/datasets/labels),
 *   soit un `payload` simplifié { type, labels, datasets, colors? } qui
 *   construit automatiquement datasets + labels (+ couleurs).
 *
 * Usage avec payload :
 *   <app-chart-panel title="Répartition" [payload]="doughnutPayload"></app-chart-panel>
 *
 * Usage avec API explicite (rétrocompatible) :
 *   <app-chart-panel title="Vue d'ensemble" [chartType]="'line'"
 *     [datasets]="datasets" [labels]="labels"></app-chart-panel>
 */
@Component({
  selector: 'app-chart-panel',
  templateUrl: './chart-panel.component.html',
  styleUrls: ['./chart-panel.component.scss'],
})
export class ChartPanelComponent implements OnInit, OnChanges, OnDestroy {
  /** Titre affiché dans le header de la carte. */
  @Input() title = '';
  /** Sous-titre optionnel (ex. 'Répartition par session'). */
  @Input() subtitle = '';
  /** Type de graphique chart.js : line | bar | doughnut | area. */
  @Input() chartType: ChartType | 'area' | 'horizontalBar' = 'line';
  /** Séries de données (API explicite, rétrocompatibilité). */
  @Input() datasets: ChartDataset[] = [];
  /** Libellés de l'axe X / catégories (API explicite). */
  @Input() labels: string[] = [];
  /** Hauteur du canvas en px. */
  @Input() height = 320;

  /** Couleur d'accent appliquée aux bordures / header. */
  @Input() accent = '#4f46e5';

  /** Événements émis vers le parent. */
  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  /** Référence au conteneur du dropdown pour détection de clic externe. */
  @ViewChild('dropdownRef') dropdownRef?: ElementRef;

  /** État d'ouverture du dropdown. */
  showDropdown = false;

  /**
   * Payload simplifié optionnel. Si fourni, construit automatiquement
   * datasets + labels (+ éventuelles couleurs) et remplace l'API explicite.
   */
  @Input() payload?: ChartPanelPayload;

  innerDatasets: ChartDataset[] = [];
  innerLabels: string[] = [];
  options: ChartOptions = {};
  internalType: ChartType = 'line';
  isArea = false;

  ngOnInit(): void {
    this.applyInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reconstruit la configuration dès qu'un payload (chargé de façon
    // asynchrone depuis le backend) devient disponible / change.
    if (changes['payload']) {
      this.applyInputs();
    }
  }

  ngOnDestroy(): void {
    // L'encapsuleur ng2-charts libère lui-même le canvas ; rien à nettoyer ici.
  }

  /** Ferme le dropdown lors d'un clic en dehors. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showDropdown && this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  /** Bascule l'état du dropdown. */
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  /** Déclenche l'événement refresh. */
  onRefresh(): void {
    this.showDropdown = false;
    this.refresh.emit();
  }

  /** Déclenche l'événement export. */
  onExport(): void {
    this.showDropdown = false;
    this.export.emit();
  }

  private applyInputs(): void {
    const p = this.payload;
    if (p && Array.isArray(p.datasets)) {
      this.buildFromPayload(p);
      return;
    }

    // Mode API explicite (rétrocompatible) : pas de palette imposée.
    const requested = this.chartType;
    if (requested === 'area') {
      this.internalType = 'line';
    } else if (requested === 'horizontalBar') {
      this.internalType = 'bar';
      // En mode explicite horizontal, on propage l'option indexAxis.
      this.options = this.defaultOptions();
      (this.options as any).indexAxis = 'y';
    } else {
      this.internalType = requested;
    }
    this.isArea = requested === 'area';
    this.innerDatasets = this.datasets || [];
    this.innerLabels = (this.labels || []).map((l) => String(l));
    this.options = this.options || this.defaultOptions();
  }

  private buildFromPayload(p: ChartPanelPayload): void {
    const type = p.type || 'bar';
    const labels = (p.labels || []).map((l) => String(l));
    const rawDatasets: Array<{ label?: string; data: number[] }> = p.datasets;
    this.innerLabels = labels;

    const palette = (p.colors && p.colors.length)
      ? p.colors
      : rawDatasets.length === 1
        ? this.paletteForBars(labels.length)
        : DEFAULT_PALETTE;

    if (type === 'doughnut') {
      this.internalType = 'doughnut';
      this.isArea = false;
      this.innerDatasets = rawDatasets.map((d, i) => {
        const count = d.data.length;
        return {
          label: d.label || '',
          data: d.data,
          backgroundColor: this.colorSlice(palette, i, count),
          hoverBackgroundColor: this.hoverSlice(palette, i, count),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 10,
        } as ChartDataset;
      });
    } else if (type === 'horizontalBar') {
      this.internalType = 'bar';
      this.isArea = false;
      this.innerDatasets = rawDatasets.map((d, i) => {
        const count = d.data.length;
        return {
          label: d.label || '',
          data: d.data,
          backgroundColor: this.colorSlice(palette, i, count),
          hoverBackgroundColor: this.hoverSlice(palette, i, count),
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.7)',
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 18,
        } as ChartDataset;
      });
    } else {
      // line / area / bar (barres simples ou séries multiples).
      this.internalType = type === 'bar' ? 'bar' : 'line';
      this.isArea = type === 'area';
      this.innerDatasets = rawDatasets.map((d, i) => {
        const color = palette[i % palette.length] || DEFAULT_PALETTE[0];
        return {
          label: d.label || '',
          data: d.data,
          backgroundColor: this.isArea ? this.alpha(color, 0.22) : color,
          borderColor: color,
          pointBackgroundColor: color,
          fill: this.isArea ? true : undefined,
          tension: this.isArea ? 0.35 : undefined,
          borderRadius: this.internalType === 'bar' ? 8 : undefined,
          borderSkipped: this.internalType === 'bar' ? false : undefined,
          barThickness: this.internalType === 'bar' && rawDatasets.length === 1 ? 26 : undefined,
          borderWidth: this.internalType === 'line' ? 2 : 1,
        } as ChartDataset;
      });
    }

    this.options = this.optionsFor(type);
  }

  /** Détermine les couleurs d'un seul jeu de barres (une couleur par barre). */
  private paletteForBars(count: number): string[] {
    if (count <= DEFAULT_PALETTE.length) {
      return DEFAULT_PALETTE.slice(0, count);
    }
    // Répète la palette si plus de catégories que de couleurs.
    const out: string[] = [];
    while (out.length < count) {
      out.push(...DEFAULT_PALETTE);
    }
    return out.slice(0, count);
  }

  /** Tranche de couleurs pour un dataset doughnut : répartit la palette. */
  private colorSlice(palette: string[], datasetIndex: number, count: number): string[] {
    const colors: string[] = [];
    for (let k = 0; k < count; k++) {
      colors.push(palette[(datasetIndex * count + k) % palette.length] || DEFAULT_PALETTE[0]);
    }
    return colors;
  }

  private hoverSlice(palette: string[], datasetIndex: number, count: number): string[] {
    const colors: string[] = [];
    for (let k = 0; k < count; k++) {
      colors.push(this.alpha(palette[(datasetIndex * count + k) % palette.length] || DEFAULT_PALETTE[0], 0.8));
    }
    return colors;
  }

  /** Ajoute un canal alpha à une couleur hex (format #RRGGBBAA). */
  private alpha(hex: string, alpha: number): string {
    const trimmed = (hex || '').replace('#', '');
    const full = trimmed.length === 3
      ? trimmed.split('').map((c) => c + c).join('')
      : trimmed.padEnd(6, '0').slice(0, 6);
    const a = Math.max(0, Math.min(1, alpha));
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${full}${alphaHex}`;
  }

  private optionsFor(payloadType: string): ChartOptions {
    const type = payloadType || 'bar';
    const isDoughnut = type === 'doughnut';
    const isHorizontal = type === 'horizontalBar';
    const isArea = type === 'area';

    const options: ChartOptions = this.defaultOptions();

    if (isDoughnut) {
      (options as any).cutout = '68%';
      (options as any).scales = { display: false };
      return options;
    }

    if (isHorizontal) {
      (options as any).indexAxis = 'y';
      options.scales = {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { color: '#6b7280' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#6b7280' },
        },
      };
      return options;
    }

    if (isArea) {
      options.plugins = options.plugins || {};
      return options;
    }

    return options;
  }

  private defaultOptions(): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          display: this.innerDatasets.length > 1,
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 8, padding: 16 },
        },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.9)',
          titleColor: '#fff',
          bodyColor: '#e5e7eb',
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', maxRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { color: '#6b7280' },
        },
      },
    };
  }
}
