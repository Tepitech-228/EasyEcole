import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss']
})
export class ChatInputComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendMediaMessage = new EventEmitter<{ message: string; file: File }>();
  @Output() notifyTyping = new EventEmitter<void>();
  @Output() openStickers = new EventEmitter<void>();

  messageText: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  fileError: string = '';

  get isImage(): boolean {
    return !!this.selectedFile?.type.startsWith('image/');
  }

  get isVideo(): boolean {
    return !!this.selectedFile?.type.startsWith('video/');
  }

  get isPdf(): boolean {
    return this.fileExtension === 'PDF';
  }

  get fileExtension(): string {
    return this.selectedFile?.name.split('.').pop()?.toUpperCase() || 'FILE';
  }

  get fileKindLabel(): string {
    if (this.isImage) return 'Image';
    if (this.isVideo) return 'Vidéo';
    if (this.isPdf) return 'Document PDF';
    return 'Document';
  }

  get formattedFileSize(): string {
    if (!this.selectedFile) return '';
    const size = this.selectedFile.size;
    return size < 1024 * 1024
      ? `${Math.max(1, Math.round(size / 1024))} Ko`
      : `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  onSend(): void {
    if (this.selectedFile) {
      this.sendMediaMessage.emit({ message: this.messageText.trim(), file: this.selectedFile });
      this.clearFile();
    } else if (this.messageText.trim()) {
      this.sendMessage.emit(this.messageText.trim());
    }
    this.messageText = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.clearFile();
      if (file.size > 50 * 1024 * 1024) {
        this.fileError = 'Le fichier ne doit pas dépasser 50 Mo.';
        return;
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const supportedExtensions = [
        'jpg', 'jpeg', 'png', 'webp', 'gif',
        'mp4', 'webm', 'mov',
        'pdf', 'doc', 'docx'
      ];
      if (!supportedExtensions.includes(extension)) {
        this.fileError = 'Ce format n’est pas pris en charge. Envoyez une image, une vidéo ou un document PDF, DOC ou DOCX.';
        return;
      }
      this.selectedFile = file;
      this.previewUrl = file.type.startsWith('image/') || file.type.startsWith('video/')
        ? URL.createObjectURL(file)
        : null;
    }
  }

  clearFile(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.selectedFile = null;
    this.previewUrl = null;
    this.fileError = '';
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onTyping(): void {
    this.notifyTyping.emit();
  }
}
