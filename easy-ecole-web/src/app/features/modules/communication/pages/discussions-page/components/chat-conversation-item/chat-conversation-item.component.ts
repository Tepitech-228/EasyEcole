import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-conversation-item',
  templateUrl: './chat-conversation-item.component.html',
  styleUrls: ['./chat-conversation-item.component.scss']
})
export class ChatConversationItemComponent {
  @Input() salon: any = null;
  @Input() isSelected: boolean = false;
  @Input() presence: Map<number, boolean> = new Map();
  @Input() currentUserId: number = 0;
  @Output() select = new EventEmitter<any>();

  private colors = ['#8956E0', '#E5A536', '#E15B8F', '#1FAE6B', '#1f3577', '#3B5BFF'];

  get avatarBg(): string {
    if (this.salon.photo) return `url(${this.salon.photo}) center/cover`;
    if (this.salon.icone) return 'linear-gradient(135deg, #3B5BFF, #8956E0)';
    const idx = (this.salon.titre?.length || 0) % this.colors.length;
    return this.colors[idx];
  }

  get avatarLetter(): string {
    if (this.salon.icone) return this.salon.icone;
    return (this.salon.titre || '?').charAt(0).toUpperCase();
  }

  get displayName(): string {
    return this.salon.titre || 'Salon';
  }

  get lastMessageTime(): string {
    if (!this.salon.dateDernierMessage) return '';
    const d = new Date(this.salon.dateDernierMessage);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Hier';
    if (days < 7) return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  get lastMessagePreview(): string {
    if (!this.salon.dernierMessage) return 'Aucun message';
    const txt = this.salon.dernierMessage;
    return txt.length > 60 ? txt.substring(0, 60) + '...' : txt;
  }

  get memberCountText(): string {
    return this.salon.memberCount || this.salon._count?.participants || '';
  }

  get isOnline(): boolean {
    return false;
  }
}
