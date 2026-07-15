import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-sticker-picker',
  templateUrl: './sticker-picker.component.html',
  styleUrls: ['./sticker-picker.component.scss']
})
export class StickerPickerComponent {
  @Output() selectSticker = new EventEmitter<string>();

  stickers: string[] = [
    '😀', '😂', '🥰', '😎', '🤔', '😴', '🥳', '😢',
    '🔥', '💯', '👍', '👎', '🙏', '💪', '🎉', '❤️',
    '⭐', '✅', '❌', '🤝', '✨', '🎊', '💡', '🎯',
    '🌊', '🚀', '🌈', '🎵', '📚', '🏆', '👋', '😭'
  ];

  onSelect(emoji: string): void {
    this.selectSticker.emit(emoji);
  }
}
