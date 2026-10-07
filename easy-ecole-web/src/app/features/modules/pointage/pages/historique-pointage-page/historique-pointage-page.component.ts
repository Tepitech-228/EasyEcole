import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { Pointage } from 'src/app/data/modules/inscription/models/Pointage.model';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';

@Component({
  selector: 'app-historique-pointage-page',
  templateUrl: './historique-pointage-page.component.html',
  styleUrls: ['./historique-pointage-page.component.scss']
})
export class HistoriquePointagePageComponent extends BaseComponentClass {
  pointages: Pointage[] = []
  loading: boolean = false

  searchTerm: string = ''
  roleFilter: string = ''
  dateFilter: string = ''

  roleLabels: { [key: string]: string } = {
    [RolesUtilisateur.ADMIN]: 'Administrateur',
    [RolesUtilisateur.APPRENANT]: 'Apprenant',
    [RolesUtilisateur.INSTITUTION]: 'Institution',
    [RolesUtilisateur.ENSEIGNANT]: 'Enseignant',
    [RolesUtilisateur.CAISSIER_BANQUE]: 'Caissier Banque',
    [RolesUtilisateur.RESSOURCES_HUMAINES]: 'Ressources Humaines',
    [RolesUtilisateur.CABINET_COMPTABLE]: 'Cabinet Comptable',
    [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'Orientation",
    [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel Administratif',
    [RolesUtilisateur.ESA_COMPTA]: 'ESA Compta',
    [RolesUtilisateur.PARENT]: 'Parent',
    [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
    [RolesUtilisateur.SURVEILLANT]: 'Surveillant',
    [RolesUtilisateur.SUPERVISEUR_GENERAL]: 'Superviseur Général',
  }

  constructor(private pointageService: PointageService) {
    super()
    this.loadPointages()
  }

  get rolesList(): { value: string, label: string }[] {
    return Object.values(RolesUtilisateur).map(v => ({ value: v as string, label: this.roleLabels[v as string] || (v as string) }))
  }

  private loadPointages(): void {
    this.loading = true
    this.pointageService.getAll().subscribe({
      next: (res) => {
        this.pointages = Array.isArray(res) ? res : []
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  get filteredPointages(): Pointage[] {
    const term = this.searchTerm.trim().toLowerCase()
    return this.pointages.filter(p => {
      const u = p.utilisateur
      const matchSearch = !term ||
        ((u?.nom || '') + ' ' + (u?.prenoms || '')).toLowerCase().includes(term) ||
        (u?.identifiant || '').toLowerCase().includes(term)
      const matchRole = !this.roleFilter || u?.role === this.roleFilter
      const matchDate = !this.dateFilter || String(p.date || '').slice(0, 10) === this.dateFilter
      return matchSearch && matchRole && matchDate
    })
  }

  get nbTotal(): number {
    return this.pointages.length
  }

  get nbToday(): number {
    const today = new Date().toISOString().slice(0, 10)
    return this.pointages.filter(p => String(p.date || '').slice(0, 10) === today).length
  }

  get nbComplets(): number {
    return this.pointages.filter(p => p.heureArrivee && p.heureDepart).length
  }

  get nbEnCours(): number {
    return this.pointages.filter(p => p.heureArrivee && !p.heureDepart).length
  }

  get hasFiltres(): boolean {
    return !!(this.searchTerm || this.roleFilter || this.dateFilter)
  }

  effacerFiltres(): void {
    this.searchTerm = ''
    this.roleFilter = ''
    this.dateFilter = ''
  }

  getNom(pointage: Pointage): string {
    const u = pointage.utilisateur
    if (!u) return '—'
    const nom = ((u.nom || '') + ' ' + (u.prenoms || '')).trim()
    return nom || u.identifiant || '—'
  }

  getInitiales(pointage: Pointage): string {
    const u = pointage.utilisateur
    if (!u) return '?'
    return ((u.nom || '?')[0] + (u.prenoms || '')[0]).toUpperCase()
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return '—'
    return this.roleLabels[role] || role
  }

  estComplet(pointage: Pointage): boolean {
    return !!(pointage.heureArrivee && pointage.heureDepart)
  }

  getDuree(pointage: Pointage): string {
    if (!pointage.heureArrivee || !pointage.heureDepart) return '—'
    const toMin = (t: string) => {
      const parts = t.split(':').map(Number)
      return (parts[0] || 0) * 60 + (parts[1] || 0)
    }
    const diff = toMin(pointage.heureDepart) - toMin(pointage.heureArrivee)
    if (isNaN(diff) || diff < 0) return '—'
    const h = Math.floor(diff / 60)
    const m = diff % 60
    if (h === 0) return m + 'min'
    return h + 'h' + (m > 0 ? ' ' + m + 'min' : '')
  }
}
