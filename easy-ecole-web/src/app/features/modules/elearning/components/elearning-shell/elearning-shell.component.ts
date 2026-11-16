import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface ElearningNavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-elearning-shell',
  templateUrl: './elearning-shell.component.html',
  styleUrls: ['./elearning-shell.component.scss']
})
export class ElearningShellComponent extends BaseComponentClass {
  readonly studentNavItems: ElearningNavItem[] = [
    { label: 'Vue d’ensemble', route: '/elearning/dashboard', icon: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6' },
    { label: 'Catalogue', route: '/elearning/catalogue', icon: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 16h16M8 7h8M8 10h6' },
    { label: 'Vidéos', route: '/elearning/videos', icon: 'm9 7 9 5-9 5zM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
    { label: 'Documents PDF', route: '/elearning/pdfs', icon: 'M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 14h8M8 17h6' },
    { label: 'Devoirs', route: '/elearning/devoirs', icon: 'M8 4h8M9 3h6v3H9zM6 5H5v16h14V5h-1M8 12l2 2 5-5M8 17h8' },
    { label: 'Quiz', route: '/elearning/quiz', icon: 'M9 9a3 3 0 1 1 5 2.2c-1.1.8-2 1.3-2 2.8M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
    { label: 'Progression', route: '/elearning/progression', icon: 'M4 19V5M4 19h17M8 15l4-4 3 2 5-7' },
    { label: 'Examens', route: '/elearning/examens', icon: 'M8 3h8M9 3v3h6V3M6 5H5v16h14V5h-1M8 12h8M8 16h5' },
    { label: 'Notes & relevés', route: '/elearning/releves', icon: 'M8 3h8M9 3v3h6V3M6 5H5v16h14V5h-1M8 12h8M8 16h5' },
  ];

  readonly adminNavItems: ElearningNavItem[] = [
    { label: 'Gestion des cours', route: '/elearning/admin/gestion', icon: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 16h16M8 7h8' },
    { label: 'Examens en ligne', route: '/elearning/admin/examens', icon: 'M8 3h8M9 3v3h6V3M6 5H5v16h14V5h-1M8 12h8M8 16h5' },
    { label: 'Centres d’examen', route: '/elearning/admin/centres', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-4h4v4' },
    { label: 'Publication des notes', route: '/elearning/admin/publications', icon: 'M8 3h8M9 3v3h6V3M6 5H5v16h14V5h-1M8 12h8M8 16h5' },
  ];

  constructor(private readonly router: Router) {
    super();
  }

  get canManage(): boolean {
    return this.rolesValue.isAdmin || this.rolesValue.isInstitution;
  }

  get pageTitle(): string {
    const url = this.router.url;
    const item = [...this.studentNavItems, ...(this.canManage ? this.adminNavItems : [])]
      .find(navItem => url === navItem.route || url.startsWith(`${navItem.route}/`));

    if (url.includes('/player')) return 'Lecture du cours';
    if (url.includes('/chat')) return 'Discussion du cours';
    if (url.includes('/upload')) return 'Supports pédagogiques';
    if (url.includes('/devoirs/')) return 'Détail du devoir';
    if (url.includes('/quiz/nouveau')) return 'Créer un quiz';
    if (/\/quiz\/[^/]+$/.test(url)) return 'Passer le quiz';
    if (item) return item.label;
    if (/\/elearning\/[^/]+$/.test(url)) return 'Détail du cours';
    return 'Espace e-learning';
  }
}
