import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface AuditEntry {
  id: string
  date: string
  utilisateur: string
  action: string
  entite: string
  details: string
  ip: string
}

@Component({
  selector: 'app-audit-logs-page',
  templateUrl: './audit-logs-page.component.html',
  styleUrls: ['./audit-logs-page.component.scss']
})
export class AuditLogsPageComponent extends BaseComponentClass {
  logs: AuditEntry[] = [
    { id: '1', date: '2026-06-23 08:30:12', utilisateur: 'admin', action: 'Connexion', entite: 'Session', details: 'Connexion réussie', ip: '192.168.1.100' },
    { id: '2', date: '2026-06-23 08:35:45', utilisateur: 'admin', action: 'Création', entite: 'Utilisateur', details: 'Création compte enseignant: Marie Kamga', ip: '192.168.1.100' },
    { id: '3', date: '2026-06-23 09:00:22', utilisateur: 'jean.dupont', action: 'Modification', entite: 'Cours', details: 'Modification chapitre "Les bases de données"', ip: '192.168.1.45' },
    { id: '4', date: '2026-06-23 09:15:08', utilisateur: 'admin', action: 'Suppression', entite: 'Inscription', details: 'Annulation inscription #1234 - Paul Tchinda', ip: '192.168.1.100' },
    { id: '5', date: '2026-06-22 14:20:33', utilisateur: 'marie.k', action: 'Publication', entite: 'Bulletin', details: 'Publication bulletins classe 3ème A', ip: '192.168.1.50' },
    { id: '6', date: '2026-06-22 11:05:17', utilisateur: 'admin', action: 'Modification', entite: 'Paramètre', details: 'Modification année scolaire courante', ip: '192.168.1.100' },
  ]
  loading: boolean = false

  constructor() { super() }

  getActionColor(action: string): string {
    switch (action) {
      case 'Connexion': return 'blue'
      case 'Création': return 'green'
      case 'Modification': return 'yellow'
      case 'Suppression': return 'red'
      case 'Publication': return 'indigo'
      default: return 'gray'
    }
  }
}
