import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-chat-message-bubble',
  templateUrl: './chat-message-bubble.component.html',
  styleUrls: ['./chat-message-bubble.component.scss']
})
export class ChatMessageBubbleComponent implements OnDestroy {
  private currentMessage: any = null;
  private mediaRequest?: Subscription;
  private mediaObjectUrl: string | null = null;
  private mediaSource = '';
  mediaUrl = '';

  @Input() set message(value: any) {
    this.currentMessage = value;
    const previewable = value?.typeMessage === 'image' || value?.typeMessage === 'video';
    this.loadMedia(previewable ? value?.pieceJointe || '' : '');
  }

  get message(): any {
    return this.currentMessage;
  }

  @Input() isOwn: boolean = false;
  @Input() authorName: string = '';
  @Input() currentUserId: number = 0;
  @Output() delete = new EventEmitter<number>();
  @Output() edit = new EventEmitter<any>();

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.mediaRequest?.unsubscribe();
    this.releaseMediaUrl();
  }

  private loadMedia(source: string): void {
    if (source === this.mediaSource) return;
    this.mediaSource = source;
    this.mediaRequest?.unsubscribe();
    this.releaseMediaUrl();
    this.mediaUrl = '';
    if (!source) return;
    if (source.startsWith('data:') || source.startsWith('blob:')) {
      this.mediaUrl = source;
      return;
    }

    this.mediaRequest = this.http.get(this.resolveMediaUrl(source), { responseType: 'blob' }).subscribe({
      next: blob => {
        this.mediaObjectUrl = URL.createObjectURL(blob);
        this.mediaUrl = this.mediaObjectUrl;
      },
      error: error => console.error('Impossible de charger le média du message:', error)
    });
  }

  private resolveMediaUrl(source: string): string {
    return source.startsWith('http') ? source : new URL(source, environment.API_BASE_URL).toString();
  }

  private releaseMediaUrl(): void {
    if (this.mediaObjectUrl) URL.revokeObjectURL(this.mediaObjectUrl);
    this.mediaObjectUrl = null;
  }

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
  get isPdf(): boolean {
    const fileName = this.message?.pendingFileName || this.message?.message || '';
    return this.isFile && (
      this.message?.mediaExtension === '.pdf'
      || /\.pdf$/i.test(String(fileName))
    );
  }
  get hasPieceJointe(): boolean {
    return !!this.message.pieceJointe;
  }
  get pieceJointeUrl(): string {
    return this.mediaUrl;
  }
  get messageTime(): string {
    if (!this.message.date) return '';
    return new Date(this.message.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  get isGroup(): boolean {
    const type = this.message?.type || this.message?.salonType;
    return type !== 'discussion' && type !== undefined;
  }

  /** Statut de delivery : 'envoye' | 'recu' | 'lu' */
  get statut(): 'envoye' | 'recu' | 'lu' {
    if (this.message?.lu) return 'lu';
    if (this.message?.statut === 'recu') return 'recu';
    return 'envoye';
  }

  showActions: boolean = false;
  toggleActions(): void { this.showActions = !this.showActions; }
  onEdit(): void { this.edit.emit({ id: this.message.id, message: this.message.message }); this.showActions = false; }
  onDelete(): void { this.delete.emit(this.message.id); this.showActions = false; }

  telechargerOuOuvrirFichier(): void {
    const source = this.message?.pieceJointe;
    if (!source) return;
    if (source.startsWith('data:')) {
      void fetch(source)
        .then(res => res.blob())
        .then(blob => this.downloadBlob(blob))
        .catch(error => console.error('Impossible de télécharger le fichier du message:', error));
      return;
    }
    this.http.get(this.resolveMediaUrl(source), { responseType: 'blob' }).subscribe({
      next: blob => this.downloadBlob(blob),
      error: error => console.error('Impossible de télécharger le fichier du message:', error)
    });
  }

  private downloadBlob(blob: Blob): void {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const messageName = String(this.message?.message || '').trim();
      const hasExtension = /\.[a-z0-9]{2,5}$/i.test(messageName);
      const mimeExtension: { [mimeType: string]: string } = {
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
      };
      a.download = hasExtension
        ? messageName
        : `${messageName || 'document'}${mimeExtension[blob.type] || ''}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
