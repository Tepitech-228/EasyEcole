import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface DossierNode {
  type: 'annee' | 'niveau' | 'parcours' | 'classe' | 'salle' | 'etudiant' | 'item';
  label: string;
  subtitle?: string;
  id?: string;
  children?: DossierNode[];
  items?: any[];
  selected?: boolean;
  expanded?: boolean;
  data?: any;
}

export interface DossierColumn {
  key: string;
  label: string;
  width?: string;
  template?: string;
}

export interface BatchAction {
  label: string;
  color: string;
  action: string;
  icon?: string;
}

@Component({
  selector: 'app-dossier-view',
  templateUrl: './dossier-view.component.html',
  styleUrls: ['./dossier-view.component.scss']
})
export class DossierViewComponent {
  @Input() nodes: DossierNode[] = [];
  @Input() columns: DossierColumn[] = [];
  @Input() batchActions: BatchAction[] = [];
  @Input() loading: boolean = false;
  @Input() selectedCount: number = 0;
  @Input() totalItems: number = 0;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() pageSize: number = 20;
  @Input() renderItemActions: boolean = false;
  @Input() itemActions: BatchAction[] = [];
  @Input() level: number = 0;
  /**
   * Comportement historique : les batchActions sont aussi affichées sur chaque
   * ligne (fusionnées avec itemActions). Mettre à false quand la page définit
   * déjà toutes ses actions par ligne dans itemActions, afin d'éviter les
   * doublons (ex. "Voir" / "Rejeter" présents dans les deux listes).
   */
  @Input() includeBatchInRowActions: boolean = true;
  /**
   * Filtre optionnel, évalué pour CHAQUE action affichée sur une ligne d'item
   * (itemActions + batchActions). Reçoit l'item et l'identifiant d'action ;
   * doit renvoyer `true` pour afficher l'action. Par défaut tout est visible.
   */
  @Input() canShowItemAction?: (item: any, action: string) => boolean;

  @Output() toggleNode = new EventEmitter<DossierNode>();
  @Output() selectionChange = new EventEmitter<{ ids: number[], node?: DossierNode }>();
  @Output() batchAction = new EventEmitter<{ action: string, ids: number[] }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() itemAction = new EventEmitter<{ item: any, action: string }>();

  selectedIds: Set<number> = new Set();

  toggleExpand(node: DossierNode): void {
    node.expanded = !node.expanded;
    this.toggleNode.emit(node);
  }

  toggleSelect(node: DossierNode): void {
    node.selected = !node.selected;
    this.updateChildSelection(node);
    this.emitSelection();
  }

  private updateChildSelection(node: DossierNode): void {
    if (node.children) {
      node.children.forEach(child => {
        child.selected = node.selected;
        this.updateChildSelection(child);
      });
    }
    if (node.items) {
      node.items.forEach(item => {
        if (item.id) {
          if (node.selected) this.selectedIds.add(Number(item.id));
          else this.selectedIds.delete(Number(item.id));
        }
      });
    }
  }

  toggleItemSelect(item: any): void {
    if (!item.id) return;
    const id = Number(item.id);
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.emitSelection();
  }

  isItemSelected(item: any): boolean {
    return item.id ? this.selectedIds.has(Number(item.id)) : false;
  }

  isAllItemsSelected(node: DossierNode): boolean {
    if (!node.items || node.items.length === 0) return false;
    return node.items.every(item => item.id && this.selectedIds.has(Number(item.id)));
  }

  toggleAllItems(node: DossierNode): void {
    if (!node.items) return;
    const allSelected = this.isAllItemsSelected(node);
    node.items.forEach(item => {
      if (item.id) {
        const id = Number(item.id);
        if (allSelected) this.selectedIds.delete(id);
        else this.selectedIds.add(id);
      }
    });
    this.emitSelection();
  }

  deselectAll(): void {
    this.selectedIds.clear();
    this.emitSelection();
  }

  private emitSelection(): void {
    this.selectionChange.emit({ ids: Array.from(this.selectedIds) });
  }

  onBatchAction(action: string): void {
    this.batchAction.emit({ action, ids: Array.from(this.selectedIds) });
  }

  /** Applique le filtre optionnel `canShowItemAction` (si fourni) pour chaque action d'une ligne. */
  isActionVisible(item: any, action: BatchAction): boolean {
    return this.canShowItemAction ? this.canShowItemAction(item, action.action) : true;
  }

  /** Actions visibles pour une ligne (itemActions, plus batchActions si fusion activée). */
  visibleActions(item: any): BatchAction[] {
    const base = this.includeBatchInRowActions
      ? [...this.itemActions, ...this.batchActions]
      : [...this.itemActions];
    return base.filter(a => this.isActionVisible(item, a));
  }

  /** Au-delà de 3 actions sur une même ligne, passage en boutons icônes (avec info-bulle). */
  useCompactActions(item: any): boolean {
    return this.visibleActions(item).length > 3;
  }

  private static readonly ACTION_COLORS: Record<string, string> = {
    green: 'text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-sm',
    red: 'text-white bg-red-600 hover:bg-red-700 border-red-600 shadow-sm',
    blue: 'text-white bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-sm',
    indigo: 'text-white bg-indigo-600 hover:bg-indigo-700 border-indigo-600 shadow-sm',
    orange: 'text-white bg-orange-500 hover:bg-orange-600 border-orange-500 shadow-sm',
    yellow: 'text-yellow-900 bg-yellow-400 hover:bg-yellow-500 border-yellow-400 shadow-sm',
    gray: 'text-gray-700 bg-gray-200 hover:bg-gray-300 border-gray-300 shadow-sm'
  };

  /** Classes statiques (compatibles Tailwind JIT) selon la couleur déclarée de l'action. */
  actionClasses(action: BatchAction, compact: boolean): string {
    const colors = DossierViewComponent.ACTION_COLORS[action.color] || DossierViewComponent.ACTION_COLORS['indigo'];
    return colors + (compact ? ' w-9' : ' px-3');
  }

  actionBackgroundColor(color: string): string {
    const backgrounds: Record<string, string> = {
      green: '#059669',
      red: '#dc2626',
      blue: '#2563eb',
      indigo: '#4f46e5',
      orange: '#f97316',
      yellow: '#facc15',
      gray: '#e5e7eb',
    };
    return backgrounds[color] || backgrounds.indigo;
  }

  actionTextColor(color: string): string {
    return color === 'yellow' || color === 'gray' ? '#1f2937' : '#ffffff';
  }

  actionBorderColor(color: string): string {
    return this.actionBackgroundColor(color);
  }

  getNodeIcon(node: DossierNode): string {
    switch (node.type) {
      case 'annee': return 'calendar_month';
      case 'niveau': return 'school';
      case 'parcours': return 'route';
      case 'classe': return 'meeting_room';
      case 'salle': return 'door_front';
      case 'etudiant': return 'person';
      case 'item': return 'description';
      default: return 'folder';
    }
  }

  getBadgeColor(value: string): string {
    switch (value) {
      case 'soumise': case 'en_attente': return 'yellow';
      case 'validee': case 'valide': return 'green';
      case 'rejetee': case 'rejete': return 'red';
      case 'delivree': return 'blue';
      case 'probleme': return 'red';
      case 'partiel': return 'orange';
      case 'regle': return 'green';
      default: return 'gray';
    }
  }

  /** Conversion sûre d'une valeur (montant, booléen, string...) en nombre pour l'affichage */
  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Classe de couleur de fond d'une ligne d'item, pilotée par le champ
   * `rowClass` (ou `statut`) porté par l'item.
   * - 'probleme'/'red'    → ligne rouge (étudiant pas en règle)
   * - 'partiel'/'orange'  → ligne orange (paiement partiel en cours)
   * - tout autre/absent   → aucune coloration
   */
  getRowClass(item: any): string {
    if (!item) return '';
    const value = item.rowClass ?? item.statut;
    if (value === 'probleme' || value === 'red') return 'bg-red-50';
    if (value === 'partiel' || value === 'orange') return 'bg-orange-50';
    return '';
  }
}
