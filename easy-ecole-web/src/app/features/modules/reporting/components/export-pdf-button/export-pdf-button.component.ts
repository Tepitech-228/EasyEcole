import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-export-pdf-button',
  template: `
    <button
      (click)="exportPdf()"
      class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
      </svg>
      Exporter PDF
    </button>
  `
})
export class ExportPdfButtonComponent {
  @Input() title: string = 'Rapport';

  exportPdf(): void {
    window.print();
  }
}
