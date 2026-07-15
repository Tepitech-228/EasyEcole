import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-new-message-modal',
  templateUrl: './new-message-modal.component.html',
  styleUrls: ['./new-message-modal.component.scss']
})
export class NewMessageModalComponent {
  @Input() availableUsers: any[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() send = new EventEmitter<{ utilisateurId: number; sujet: string; message: string }>();

  searchQuery: string = '';
  selectedUser: any = null;
  sujet: string = '';
  message: string = '';

  get filteredUsers(): any[] {
    const q = this.searchQuery.toLowerCase();
    return (this.availableUsers || []).filter(u => {
      const name = `${u.prenoms || ''} ${u.nom || ''}`.toLowerCase();
      return name.includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.searchQuery = `${user.prenoms || ''} ${user.nom || ''}`.trim();
  }

  onSend(): void {
    if (!this.selectedUser || !this.message.trim()) return;
    this.send.emit({
      utilisateurId: this.selectedUser.id,
      sujet: this.sujet,
      message: this.message.trim()
    });
  }
}
