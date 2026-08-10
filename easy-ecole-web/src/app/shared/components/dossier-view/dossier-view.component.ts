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
      default: return 'gray';
    }
  }

  /** Conversion sûre d'une valeur (montant, booléen, string...) en nombre pour l'affichage */
  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
}
