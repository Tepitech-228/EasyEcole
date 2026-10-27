import { Component } from '@angular/core';
import { saveAs } from 'file-saver';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { Pointage } from 'src/app/data/modules/inscription/models/Pointage.model';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';

type PeriodeRaccourci = 'today' | '7j' | '30j' | 'mois' | 'tout' | 'custom';
type TriPointage = 'date_desc' | 'date_asc' | 'nom_asc' | 'duree_desc';

@Component({
  selector: 'app-historique-pointage-page',
  templateUrl: './historique-pointage-page.component.html',
  styleUrls: ['./historique-pointage-page.component.scss']
})
export class HistoriquePointagePageComponent extends BaseComponentClass {
  pointages: Pointage[] = []
  loading: boolean = false
  loadError: string = ''
  exporting: 'xlsx' | 'docx' | null = null

  searchTerm: string = ''
  roleFilter: string = ''
  statutFilter: string = ''
  sortBy: TriPointage = 'date_desc'

  dateDebut: string = ''
  dateFin: string = ''
  periode: PeriodeRaccourci = '30j'

  page: number = 1
  pageSize: number = 15

  readonly roleLabels: { [key: string]: string } = {
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

  readonly periodes: { key: PeriodeRaccourci, label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: '7j', label: '7 jours' },
    { key: '30j', label: '30 jours' },
    { key: 'mois', label: 'Ce mois' },
    { key: 'tout', label: 'Tout' },
  ]

  constructor(
    private pointageService: PointageService,
    private toastService: ToastService
  ) {
    super()
    this.appliquerPeriode('30j')
    this.loadPointages()
  }

  // ---------------------------------------------------------------- Données

  loadPointages(): void {
    this.loading = true
    this.loadError = ''
    this.pointageService.getAll().subscribe({
      next: (res) => {
        this.pointages = Array.isArray(res) ? res : []
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.loadError = err?.error?.message || 'Impossible de charger l’historique des pointages'
      }
    })
  }

  get rolesList(): { value: string, label: string }[] {
    return Object.values(RolesUtilisateur).map(v => ({ value: v as string, label: this.roleLabels[v as string] || (v as string) }))
  }

  // ---------------------------------------------------------------- Période

  private toIsoDate(date: Date): string {
    const annee = date.getFullYear()
    const mois = String(date.getMonth() + 1).padStart(2, '0')
    const jour = String(date.getDate()).padStart(2, '0')
    return `${annee}-${mois}-${jour}`
  }

  appliquerPeriode(periode: PeriodeRaccourci): void {
    this.periode = periode
    const aujourdHui = new Date()

    if (periode === 'today') {
      this.dateDebut = this.toIsoDate(aujourdHui)
      this.dateFin = this.dateDebut
    } else if (periode === '7j') {
      const debut = new Date()
      debut.setDate(debut.getDate() - 6)
      this.dateDebut = this.toIsoDate(debut)
      this.dateFin = this.toIsoDate(aujourdHui)
    } else if (periode === '30j') {
      const debut = new Date()
      debut.setDate(debut.getDate() - 29)
      this.dateDebut = this.toIsoDate(debut)
      this.dateFin = this.toIsoDate(aujourdHui)
    } else if (periode === 'mois') {
      const debut = new Date()
      debut.setDate(1)
      this.dateDebut = this.toIsoDate(debut)
      this.dateFin = this.toIsoDate(aujourdHui)
    } else if (periode === 'tout') {
      this.dateDebut = ''
      this.dateFin = ''
    }

    this.page = 1
  }

  onDateChange(): void {
    this.periode = 'custom'
    this.page = 1
  }

  get periodeLabel(): string {
    if (!this.dateDebut && !this.dateFin) return 'Toutes les données disponibles'
    if (this.dateDebut && this.dateFin && this.dateDebut === this.dateFin) {
      return this.formatDateCourte(this.dateDebut)
    }
    const debut = this.dateDebut ? this.formatDateCourte(this.dateDebut) : 'le début'
    const fin = this.dateFin ? this.formatDateCourte(this.dateFin) : "aujourd'hui"
    return `${debut} → ${fin}`
  }

  private formatDateCourte(iso: string): string {
    const date = new Date(`${iso}T00:00:00`)
    if (isNaN(date.getTime())) return iso
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ---------------------------------------------------------------- Filtres

  private normaliser(valeur: string | undefined | null): string {
    return String(valeur || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  get filteredPointages(): Pointage[] {
    const terme = this.normaliser(this.searchTerm)
    return this.pointages.filter(pointage => {
      const utilisateur = pointage.utilisateur
      const date = String(pointage.date || '').slice(0, 10)

      if (this.dateDebut && date < this.dateDebut) return false
      if (this.dateFin && date > this.dateFin) return false
      if (this.roleFilter && utilisateur?.role !== this.roleFilter) return false

      if (terme) {
        const contenu = this.normaliser(
          `${utilisateur?.nom || ''} ${utilisateur?.prenoms || ''} ${utilisateur?.identifiant || ''}`
        )
        if (!contenu.includes(terme)) return false
      }

      const complet = this.estComplet(pointage)
      if (this.statutFilter === 'complet' && !complet) return false
      if (this.statutFilter === 'en_cours' && complet) return false

      return true
    })
  }

  get sortedPointages(): Pointage[] {
    const copie = [...this.filteredPointages]
    switch (this.sortBy) {
      case 'date_asc':
        return copie.sort((a, b) => this.comparerDate(a, b))
      case 'nom_asc':
        return copie.sort((a, b) => this.getNom(a).localeCompare(this.getNom(b), 'fr', { sensitivity: 'base' }))
      case 'duree_desc':
        return copie.sort((a, b) => (this.getDureeMinutes(b) ?? -1) - (this.getDureeMinutes(a) ?? -1))
      default:
        return copie.sort((a, b) => this.comparerDate(b, a))
    }
  }

  private comparerDate(a: Pointage, b: Pointage): number {
    const cleA = `${String(a.date || '').slice(0, 10)} ${a.heureArrivee || ''}`
    const cleB = `${String(b.date || '').slice(0, 10)} ${b.heureArrivee || ''}`
    return cleA.localeCompare(cleB)
  }

  get hasFiltres(): boolean {
    return !!(this.searchTerm || this.roleFilter || this.statutFilter) || this.periode !== '30j'
  }

  onFilterChange(): void {
    this.page = 1
  }

  resetFiltres(): void {
    this.searchTerm = ''
    this.roleFilter = ''
    this.statutFilter = ''
    this.sortBy = 'date_desc'
    this.appliquerPeriode('30j')
  }

  // ------------------------------------------------------------ Statistiques

  get nbTotal(): number {
    return this.filteredPointages.length
  }

  get nbPersonnes(): number {
    const identifiants = this.filteredPointages.map(
      pointage => String(pointage.utilisateurId || pointage.utilisateur?.id || '')
    ).filter(Boolean)
    return new Set(identifiants).size
  }

  get nbComplets(): number {
    return this.filteredPointages.filter(pointage => this.estComplet(pointage)).length
  }

  get nbEnCours(): number {
    return this.filteredPointages.filter(
      pointage => !!pointage.heureArrivee && !pointage.heureDepart
    ).length
  }

  get minutesTotales(): number {
    return this.filteredPointages.reduce(
      (somme, pointage) => somme + (this.getDureeMinutes(pointage) || 0), 0
    )
  }

  get dureeTotaleLabel(): string {
    return this.formatDuree(this.minutesTotales)
  }

  get tauxCompletude(): number {
    if (this.nbTotal === 0) return 0
    return Math.round((this.nbComplets / this.nbTotal) * 100)
  }

  // -------------------------------------------------------------- Pagination

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedPointages.length / this.pageSize))
  }

  get pageCourante(): number {
    return Math.min(Math.max(1, this.page), this.totalPages)
  }

  get pagedPointages(): Pointage[] {
    const debut = (this.pageCourante - 1) * this.pageSize
    return this.sortedPointages.slice(debut, debut + this.pageSize)
  }

  get debutAffichage(): number {
    if (this.sortedPointages.length === 0) return 0
    return (this.pageCourante - 1) * this.pageSize + 1
  }

  get finAffichage(): number {
    return Math.min(this.pageCourante * this.pageSize, this.sortedPointages.length)
  }

  changerPage(page: number): void {
    this.page = Math.min(Math.max(1, page), this.totalPages)
  }

  onPageSizeChange(): void {
    this.page = 1
  }

  // -------------------------------------------------------------- Affichage

  trackByPointage(_index: number, pointage: Pointage): string | number {
    return pointage.id || `${pointage.utilisateurId}-${String(pointage.date).slice(0, 10)}`
  }

  getNom(pointage: Pointage): string {
    const utilisateur = pointage.utilisateur
    if (!utilisateur) return '—'
    const nom = `${utilisateur.nom || ''} ${utilisateur.prenoms || ''}`.trim()
    return nom || utilisateur.identifiant || '—'
  }

  getInitiales(pointage: Pointage): string {
    const utilisateur = pointage.utilisateur
    if (!utilisateur) return '?'
    return `${(utilisateur.nom || '?')[0]}${(utilisateur.prenoms || '')[0] || ''}`.toUpperCase()
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return '—'
    return this.roleLabels[role] || role
  }

  /** Tonalité visuelle du badge de rôle. */
  roleTone(role: string | undefined): string {
    switch (role) {
      case RolesUtilisateur.APPRENANT: return 'teal'
      case RolesUtilisateur.ENSEIGNANT: return 'indigo'
      case RolesUtilisateur.ADMIN:
      case RolesUtilisateur.SUPERVISEUR_GENERAL: return 'navy'
      case RolesUtilisateur.SURVEILLANT: return 'amber'
      default: return 'slate'
    }
  }

  getHeure(heure: string | undefined): string {
    if (!heure) return '—'
    return String(heure).slice(0, 5)
  }

  getJour(date: Date | string | undefined): string {
    const iso = String(date || '').slice(0, 10)
    const correspondance = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!correspondance) return ''
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const valeur = new Date(Date.UTC(
      Number(correspondance[1]), Number(correspondance[2]) - 1, Number(correspondance[3])
    ))
    return jours[valeur.getUTCDay()] || ''
  }

  estComplet(pointage: Pointage): boolean {
    return !!(pointage.heureArrivee && pointage.heureDepart)
  }

  getDureeMinutes(pointage: Pointage): number | null {
    if (!pointage.heureArrivee || !pointage.heureDepart) return null
    const enMinutes = (heure: string): number | null => {
      const correspondance = String(heure).match(/(\d{1,2}):(\d{2})/)
      if (!correspondance) return null
      return Number(correspondance[1]) * 60 + Number(correspondance[2])
    }
    const debut = enMinutes(pointage.heureArrivee)
    const fin = enMinutes(pointage.heureDepart)
    if (debut === null || fin === null) return null
    return Math.max(0, fin - debut)
  }

  formatDuree(minutes: number | null): string {
    if (minutes === null) return '—'
    const heures = Math.floor(minutes / 60)
    const reste = minutes % 60
    if (heures === 0) return `${reste} min`
    return `${heures}h${reste > 0 ? String(reste).padStart(2, '0') : ''}`
  }

  getDuree(pointage: Pointage): string {
    return this.formatDuree(this.getDureeMinutes(pointage))
  }

  getPassages(pointage: Pointage): string[] {
    return (pointage.scans || [])
      .map(scan => this.getHeure(scan.heure))
      .filter(heure => heure !== '—')
  }

  getPassagesTooltip(pointage: Pointage): string {
    const passages = this.getPassages(pointage)
    if (passages.length === 0) return 'Aucun passage enregistré'
    return `Passages : ${passages.join(' · ')}`
  }

  // ----------------------------------------------------------------- Export

  get exportDisponible(): boolean {
    return this.filteredPointages.length > 0
  }

  exporter(format: 'xlsx' | 'docx'): void {
    if (this.exporting || !this.exportDisponible) return
    this.exporting = format
    this.pointageService.exportPointages({
      format,
      debut: this.dateDebut || undefined,
      fin: this.dateFin || undefined,
      role: this.roleFilter || undefined,
      search: this.searchTerm.trim() || undefined,
      statut: this.statutFilter || undefined,
    }).subscribe({
      next: (blob) => {
        this.exporting = null
        const nomFichier = `pointages_${this.dateDebut || 'debut'}_${this.dateFin || 'fin'}.${format}`
        saveAs(blob, nomFichier)
        this.toastService.success(`Export ${format === 'xlsx' ? 'Excel' : 'Word'} généré`)
      },
      error: async (err) => {
        this.exporting = null
        let message = "Impossible de générer l'export"
        if (err?.error instanceof Blob) {
          try {
            const texte = await err.error.text()
            const corps = JSON.parse(texte)
            message = corps?.message || message
          } catch {
            // Corps non JSON : on conserve le message générique.
          }
        } else if (err?.error?.message) {
          message = err.error.message
        }
        this.toastService.error(message)
      }
    })
  }
}
