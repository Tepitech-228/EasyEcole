import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent {
  @Input() salon: any = null;
  @Input() messages: any[] = [];
  @Input() members: any[] = [];
  @Input() typingUsers: string[] = [];
  @Input() currentUserId: number = 0;
  @Input() currentUserName: string = '';
  @Input() showInfoPanel: boolean = false;
  @Input() showStickerPicker: boolean = false;
  @Input() hasMoreMessages: boolean = true;
  @Input() loadingMessages: boolean = false;
  @Input() availableUsers: any[] = [];
  @Input() estAdmin: boolean = false;
  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendMediaMessage = new EventEmitter<any>();
  @Output() sendSticker = new EventEmitter<string>();
  @Output() notifyTyping = new EventEmitter<void>();
  @Output() loadMoreMessages = new EventEmitter<void>();
  @Output() deleteMessage = new EventEmitter<number>();
  @Output() editMessage = new EventEmitter<any>();
  @Output() toggleInfoPanel = new EventEmitter<void>();
  @Output() toggleStickerPicker = new EventEmitter<void>();
  @Output() promoteMember = new EventEmitter<number>();
  @Output() demoteMember = new EventEmitter<number>();
  @Output() removeMember = new EventEmitter<number>();
  @Output() addMember = new EventEmitter<number>();
  @Output() generateInvite = new EventEmitter<void>();
  @Output() leaveGroup = new EventEmitter<void>();

  showDaySeparator(index: number): boolean {
    if (index === 0) return true;
    const prev = new Date(this.messages[index - 1]?.date);
    const curr = new Date(this.messages[index]?.date);
    return prev.toDateString() !== curr.toDateString();
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
