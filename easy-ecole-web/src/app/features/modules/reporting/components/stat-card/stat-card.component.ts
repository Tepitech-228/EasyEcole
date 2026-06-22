import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <div class="bg-white rounded-lg shadow p-6 flex flex-col">
      <span class="text-sm font-medium text-gray-500 uppercase tracking-wide">{{ label }}</span>
      <span class="text-3xl font-bold mt-2" [class]="colorClass">{{ value }}</span>
      <span *ngIf="subtitle" class="text-xs text-gray-400 mt-1">{{ subtitle }}</span>
    </div>
  `
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() subtitle: string = '';
  @Input() colorClass: string = 'text-gray-900';
}
