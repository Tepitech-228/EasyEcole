import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-export-pdf-button',
  templateUrl: './export-pdf-button.component.html',
  styleUrls: ['./export-pdf-button.component.scss']
})
export class ExportPdfButtonComponent {
  @Input() title: string = 'Rapport';

  exportPdf(): void {
    window.print();
  }
}
