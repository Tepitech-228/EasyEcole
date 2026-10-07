import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';

interface RapportEntry {
  utilisateurId: number
  nom: string
  prenoms: string
  identifiant: string
  role: string
  presences: number
  heuresTotales: number
  sansDepart: number
}

@Component({
  selector: 'app-rapports-pointage-page',
  templateUrl: './rapports-pointage-page.component.html',
  styleUrls: ['./rapports-pointage-page.component.scss']
})
export class RapportsPointagePageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = false
  loadError: string = ''

  debut: string = ''
  fin: string = ''

  summary = {
    pointages: 0,
    personnes: 0,
    presentsAujourdhui: 0,
    completsAujourdhui: 0,
    enCoursAujourdhui: 0,
    tauxCompletude: 0,
  }

  entries: RapportEntry[] = []

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
    const now = new Date()
    this.debut = now.toISOString().slice(0, 7) + '-01'
    this.fin = now.toISOString().slice(0, 10)
  }

  ngOnInit(): void {
    this.loadRapport()
  }

  loadRapport(): void {
    this.loading = true
    this.loadError = ''
    this.pointageService.getRapport(this.debut || undefined, this.fin || undefined).subscribe({
      next: (res) => {
        this.summary = res.summary || this.summary
        this.entries = Array.isArray(res.entries) ? res.entries : []
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.loadError = err?.error?.message || 'Impossible de charger le rapport'
      }
    })
  }

  getNom(e: RapportEntry): string {
    const nom = ((e.nom || '') + ' ' + (e.prenoms || '')).trim()
    return nom || e.identifiant || '—'
  }

  getInitiales(e: RapportEntry): string {
    return (((e.nom || '?')[0] || '?') + ((e.prenoms || '')[0] || '')).toUpperCase()
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return '—'
    return this.roleLabels[role] || role
  }

  formatHeures(h: number): string {
    if (h === undefined || h === null) return '—'
    return String(h).replace('.', ',') + 'h'
  }
}
