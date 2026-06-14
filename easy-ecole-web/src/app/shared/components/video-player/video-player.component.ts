import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {

  @Input() src!: string

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
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
