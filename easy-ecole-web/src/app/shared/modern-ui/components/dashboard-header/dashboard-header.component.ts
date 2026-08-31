import { Component, Input } from '@angular/core';

/**
 * En-tête de page moderne pour les dashboards : titre, sous-titre et
 * badges contextuels (session académique, année, établissement).
 */
@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss'],
})
export class DashboardHeaderComponent {
  @Input() title = 'Tableau de bord';
  @Input() subtitle = '';
  @Input() sessionLabel = '';
  @Input() accent = '#4f46e5';
  @Input() icon = 'dashboard';
}
