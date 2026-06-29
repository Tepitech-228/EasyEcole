import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface Sauvegarde {
  id: string
  nom: string
  date: string
  taille: string
  type: string
  statut: string
}

@Component({
  selector: 'app-sauvegardes-page',
  templateUrl: './sauvegardes-page.component.html',
  styleUrls: ['./sauvegardes-page.component.scss']
})
export class SauvegardesPageComponent extends BaseComponentClass {
  sauvegardes: Sauvegarde[] = [
    { id: '1', nom: 'backup-2026-06-23', date: '2026-06-23 02:00', taille: '256 MB', type: 'Automatique', statut: 'Succès' },
    { id: '2', nom: 'backup-2026-06-22', date: '2026-06-22 02:00', taille: '254 MB', type: 'Automatique', statut: 'Succès' },
    { id: '3', nom: 'backup-2026-06-21', date: '2026-06-21 02:00', taille: '250 MB', type: 'Automatique', statut: 'Succès' },
    { id: '4', nom: 'backup-manual-2026-06-20', date: '2026-06-20 10:30', taille: '248 MB', type: 'Manuelle', statut: 'Succès' },
  ]
  loading: boolean = false
  saving: boolean = false
  success: boolean = false

  constructor() { super() }

  lancerSauvegarde(): void {
    this.saving = true
    setTimeout(() => {
      this.saving = false
      this.success = true
      setTimeout(() => this.success = false, 3000)
    }, 2000)
  }
}
