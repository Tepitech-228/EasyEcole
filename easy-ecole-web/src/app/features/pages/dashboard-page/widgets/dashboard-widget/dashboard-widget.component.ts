import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-widget',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.scss']
})
export class DashboardWidgetComponent {
  @Input() title: string = ''
  @Input() icon: string = ''
  @Input() loading: boolean = false
  @Input() empty: boolean = false
  @Input() emptyMessage: string = 'Aucune donnée'
  @Input() link: string = ''
}
