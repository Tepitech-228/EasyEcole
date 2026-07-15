import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss']
})
export class ChatInputComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendMediaMessage = new EventEmitter<any>();
  @Output() notifyTyping = new EventEmitter<void>();
  @Output() openStickers = new EventEmitter<void>();

  messageText: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  onSend(): void {
    if (this.selectedFile) {
      this.sendMediaMessage.emit({
        message: this.messageText,
        typeMessage: this.selectedFile.type.startsWith('image/') ? 'image' : this.selectedFile.type.startsWith('video/') ? 'video' : 'fichier',
        pieceJointe: this.previewUrl
      });
      this.clearFile();
    } else if (this.messageText.trim()) {
      this.sendMessage.emit(this.messageText.trim());
    }
    this.messageText = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => { this.previewUrl = e.target?.result as string; };
        reader.readAsDataURL(file);
      } else {
        this.previewUrl = null;
      }
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
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
