import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-group-info-panel',
  templateUrl: './group-info-panel.component.html',
  styleUrls: ['./group-info-panel.component.scss']
})
export class GroupInfoPanelComponent {
  @Input() salon: any = null;
  @Input() members: any[] = [];
  @Input() currentUserId: number = 0;
  @Input() estAdmin: boolean = false;
  @Input() allUsers: any[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() promote = new EventEmitter<number>();
  @Output() demote = new EventEmitter<number>();
  @Output() removeMember = new EventEmitter<number>();
  @Output() addMember = new EventEmitter<number>();
  @Output() generateInvite = new EventEmitter<void>();
  @Output() leaveGroup = new EventEmitter<void>();

  memberSearch: string = '';

  get displayName(): string {
    return this.salon?.titre || 'Groupe';
  }

  get description(): string {
    return this.salon?.description || 'Aucune description';
  }

  get memberCount(): number {
    return this.members?.length || 0;
  }

  get filteredUsers(): any[] {
    if (!this.memberSearch) return [];
    const q = this.memberSearch.toLowerCase();
    const memberIds = new Set(this.members.map(m => m.id));
    return this.allUsers.filter(u =>
      !memberIds.has(this.normalizeId(u.id)) &&
      (`${u.prenoms || ''} ${u.nom || ''}`.toLowerCase().includes(q) ||
       (u.email || '').toLowerCase().includes(q))
    ).slice(0, 20);
  }

  get allNonMembers(): any[] {
    const memberIds = new Set(this.members.map(m => m.id));
    return (this.allUsers || []).filter(u => !memberIds.has(this.normalizeId(u.id)));
  }

  isAdmin(member: any): boolean {
    return member.role === 'Admin' || member.role === 'admin';
  }

  onAddMember(userId: number): void {
    this.addMember.emit(userId);
    this.memberSearch = '';
  }

  private normalizeId(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
}
