import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number | null = '';
  @Input() subtitle: string = '';
  @Input() colorClass: string = 'text-gray-900';
}
