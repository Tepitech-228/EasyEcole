import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-support-card',
  templateUrl: './support-card.component.html'
})
export class SupportCardComponent {
  @Input() support: any;

  getIcon(): string {
    switch (this.support.type) {
      case 'video': return '🎬';
      case 'pdf': return '📄';
      default: return '📁';
    }
  }
}

