import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-monitoring-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() icon = 'info';
  @Input() title = 'Données indisponibles';
  @Input() message = 'Les données demandées ne sont pas disponibles pour le moment. Veuillez réessayer plus tard.';
  @Input() retryLabel = 'Réessayer';
  @Output() retry = new EventEmitter<void>();
}
