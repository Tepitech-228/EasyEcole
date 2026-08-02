import { Component, Input } from '@angular/core';

export type CourseStatus = 'validee' | 'non_validee' | 'en_cours' | 'non_entamee' | 'dette_active' | 'resorbee';

@Component({
  selector: 'app-course-status-badge',
  templateUrl: './course-status-badge.component.html',
  styleUrls: ['./course-status-badge.component.scss']
})
export class CourseStatusBadgeComponent {
  @Input() status!: CourseStatus;
  @Input() size: 'sm' | 'md' = 'sm';

  get label(): string {
    const labels: Record<CourseStatus, string> = {
      'validee': 'Validé',
      'non_validee': 'Non validé',
      'en_cours': 'En cours',
      'non_entamee': 'Non entamé',
      'dette_active': 'Dette active',
      'resorbee': 'Resorbé'
    };
    return labels[this.status] || this.status;
  }

  get colorClass(): string {
    const colors: Record<CourseStatus, string> = {
      'validee': 'bg-green-100 text-green-800 ring-green-500/20',
      'non_validee': 'bg-red-100 text-red-800 ring-red-500/20',
      'en_cours': 'bg-yellow-100 text-yellow-800 ring-yellow-500/20',
      'non_entamee': 'bg-gray-100 text-gray-500 ring-gray-400/20',
      'dette_active': 'bg-red-100 text-red-800 ring-red-500/20',
      'resorbee': 'bg-blue-100 text-blue-800 ring-blue-500/20'
    };
    return colors[this.status] || 'bg-gray-100 text-gray-500';
  }

  get dotColor(): string {
    const dots: Record<CourseStatus, string> = {
      'validee': 'bg-green-500',
      'non_validee': 'bg-red-500',
      'en_cours': 'bg-yellow-500',
      'non_entamee': 'bg-gray-400',
      'dette_active': 'bg-red-500',
      'resorbee': 'bg-blue-500'
    };
    return dots[this.status] || 'bg-gray-400';
  }
}
