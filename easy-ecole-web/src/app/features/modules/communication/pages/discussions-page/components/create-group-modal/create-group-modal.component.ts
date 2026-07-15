import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-create-group-modal',
  templateUrl: './create-group-modal.component.html',
  styleUrls: ['./create-group-modal.component.scss']
})
export class CreateGroupModalComponent {
  @Input() availableUsers: any[] = [];
  @Input() currentUserId: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<{ titre: string; participants: number[] }>();

  groupName: string = '';
  groupDescription: string = '';
  groupType: string = 'groupe';
  selectedIcon: string = '💻';
  visibility: string = 'prive';
  selectedUserIds: Set<number> = new Set();
  userSearch: string = '';

  icons: string[] = ['💻', '🏀', '🎨', '📚'];

  get filteredUsers(): any[] {
    const q = this.userSearch.toLowerCase();
    return (this.availableUsers || []).filter(u => {
      const name = `${u.prenoms || ''} ${u.nom || ''}`.toLowerCase();
      return name.includes(q);
    });
  }

  selectIcon(icon: string): void { this.selectedIcon = icon; }

  toggleUser(id: any): void {
    const nid = this.normalizeId(id);
    if (this.selectedUserIds.has(nid)) this.selectedUserIds.delete(nid);
    else this.selectedUserIds.add(nid);
  }

  isSelected(id: any): boolean { return this.selectedUserIds.has(this.normalizeId(id)); }

  removeUser(id: number): void { this.selectedUserIds.delete(id); }

  getSelectedUsers(): any[] {
    return (this.availableUsers || []).filter(u => this.selectedUserIds.has(this.normalizeId(u.id)));
  }

  onCreate(): void {
    if (!this.groupName.trim()) return;
    this.create.emit({
      titre: this.groupName.trim(),
      participants: [...this.selectedUserIds]
    });
  }

  normalizeId(id: any): number {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
}
