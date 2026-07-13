import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {

  @Input() src!: string
  @Output() ended = new EventEmitter<void>()

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
  }

  onVideoEnded(): void {
    this.ended.emit();
  }

  isYoutubeVideo(src: string): boolean {
    if(src.startsWith('https://www.youtube.com') || src.startsWith('http://www.youtube.com')) {
      return true
    }
    return false
  }

  sanitizeUrl(src: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(src.replace('watch?v=', 'embed/'))
  }

}
