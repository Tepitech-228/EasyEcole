import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-custom-pdf-viewer',
  templateUrl: './custom-pdf-viewer.component.html',
  styleUrls: ['./custom-pdf-viewer.component.scss']
})
export class CustomPdfViewerComponent implements OnInit {

  @Input() src!: string
  @Input() title!: string
  @Input() subtitle?: string
  @Input() show!: boolean
  @Output() onClose: EventEmitter<any> = new EventEmitter()
  
  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
  }

  sanitizeUrl(src: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(src)
  }

  close(): void {
    this.show = false
    this.onClose.emit()
  }

}
