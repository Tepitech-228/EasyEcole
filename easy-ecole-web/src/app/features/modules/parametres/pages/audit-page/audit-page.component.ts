import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface AuditLog {
  id: string
  date: string
  utilisateur: string
  action: string
  entite: string
  details: string
}

@Component({
  selector: 'app-audit-page',
  templateUrl: './audit-page.component.html',
  styleUrls: ['./audit-page.component.scss']
})
export class AuditPageComponent extends BaseComponentClass {
  logs: AuditLog[] = [
    { id: '1', date: '2026-06-23 08:30', utilisateur: 'admin', action: 'Connexion', entite: 'Session', details: 'Connexion réussie' },
    { id: '2', date: '2026-06-23 08:35', utilisateur: 'admin', action: 'Création', entite: 'Utilisateur', details: 'Création compte enseignant' },
    { id: '3', date: '2026-06-23 09:00', utilisateur: 'jean.dupont', action: 'Modification', entite: 'Cours', details: 'Modification chapitre 3' },
    { id: '4', date: '2026-06-23 09:15', utilisateur: 'admin', action: 'Suppression', entite: 'Inscription', details: 'Annulation inscription #1234' },
    { id: '5', date: '2026-06-22 14:20', utilisateur: 'marie.k', action: 'Publication', entite: 'Bulletin', details: 'Publication bulletin classe 3A' },
  ]
  loading: boolean = false

  constructor() { super() }

  getActionColor(action: string): string {
    switch (action) {
      case 'Connexion': return 'blue'
      case 'Création': return 'green'
      case 'Modification': return 'yellow'
      case 'Suppression': return 'red'
      default: return 'gray'
    }
  }
}
