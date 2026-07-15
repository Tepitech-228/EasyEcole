import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-message-bubble',
  templateUrl: './chat-message-bubble.component.html',
  styleUrls: ['./chat-message-bubble.component.scss']
})
export class ChatMessageBubbleComponent {
  @Input() message: any = null;
  @Input() isOwn: boolean = false;
  @Input() authorName: string = '';
  @Input() currentUserId: number = 0;
  @Output() delete = new EventEmitter<number>();
  @Output() edit = new EventEmitter<any>();

  get isText(): boolean {
    return !this.message.typeMessage || this.message.typeMessage === 'text';
  }
  get isSticker(): boolean {
    return this.message.typeMessage === 'sticker';
  }
  get isImage(): boolean {
    return this.message.typeMessage === 'image';
  }
  get isVideo(): boolean {
    return this.message.typeMessage === 'video';
  }
  get isFile(): boolean {
    return this.message.typeMessage === 'fichier';
  }
  get hasPieceJointe(): boolean {
    return !!this.message.pieceJointe;
  }
  get pieceJointeUrl(): string {
    return this.message.pieceJointe || '';
  }
  get messageTime(): string {
    if (!this.message.date) return '';
    return new Date(this.message.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  get isGroup(): boolean {
    const type = this.message?.type || this.message?.salonType;
    return type !== 'discussion' && type !== undefined;
  }

  showActions: boolean = false;
  toggleActions(): void { this.showActions = !this.showActions; }
  onEdit(): void { this.edit.emit({ id: this.message.id, message: this.message.message }); this.showActions = false; }
  onDelete(): void { this.delete.emit(this.message.id); this.showActions = false; }
}
