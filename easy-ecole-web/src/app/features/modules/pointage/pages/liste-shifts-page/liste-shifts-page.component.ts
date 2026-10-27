import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { Shift } from 'src/app/data/modules/inscription/models/Shift.model';
import { ShiftService } from 'src/app/data/modules/inscription/services/shift.service';

type FiltreStatut = 'tous' | 'actif' | 'inactif';

@Component({
  selector: 'app-liste-shifts-page',
  templateUrl: './liste-shifts-page.component.html',
  styleUrls: ['./liste-shifts-page.component.scss']
})
export class ListeShiftsPageComponent extends BaseComponentClass implements OnInit {
  shifts: Shift[] = []
  loading: boolean = false
  loadError: string = ''
  deletingId: number | null = null
  toggleEnCours: number | null = null

  searchTerm: string = ''
  statutFilter: FiltreStatut = 'tous'

  readonly joursSemaine: { court: string, long: string }[] = [
    { court: 'Lun', long: 'Lundi' },
    { court: 'Mar', long: 'Mardi' },
    { court: 'Mer', long: 'Mercredi' },
    { court: 'Jeu', long: 'Jeudi' },
    { court: 'Ven', long: 'Vendredi' },
    { court: 'Sam', long: 'Samedi' },
    { court: 'Dim', long: 'Dimanche' },
  ]

  constructor(
    private router: Router,
    private shiftService: ShiftService,
    private toastService: ToastService
  ) { super() }

  ngOnInit(): void {
    this.loadShifts()
  }

  // ---------------------------------------------------------------- Données

  loadShifts(): void {
    this.loading = true
    this.loadError = ''
    this.shiftService.getAll().subscribe({
      next: (res) => {
        this.shifts = Array.isArray(res) ? res : []
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.loadError = err?.error?.message || 'Impossible de charger les shifts'
      }
    })
  }

  get filteredShifts(): Shift[] {
    const terme = this.normaliser(this.searchTerm)
    return this.shifts.filter(shift => {
      if (this.statutFilter === 'actif' && !shift.actif) return false
      if (this.statutFilter === 'inactif' && shift.actif) return false
      if (terme && !this.normaliser(shift.nom).includes(terme)) return false
      return true
    })
  }

  private normaliser(valeur: string | undefined | null): string {
    return String(valeur || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  get hasFiltres(): boolean {
    return !!(this.searchTerm || this.statutFilter !== 'tous')
  }

  resetFiltres(): void {
    this.searchTerm = ''
    this.statutFilter = 'tous'
  }

  // -------------------------------------------------------------- Indicateurs

  get nbTotal(): number {
    return this.shifts.length
  }

  get nbActifs(): number {
    return this.shifts.filter(shift => shift.actif).length
  }

  get nbInactifs(): number {
    return this.nbTotal - this.nbActifs
  }

  get nbJoursCouverts(): number {
    const jours = new Set<string>()
    this.shifts.filter(shift => shift.actif).forEach(shift => {
      (shift.jours || []).forEach(jour => jours.add(jour))
    })
    return jours.size
  }

  get couvertureHebdomadaire(): string {
    const minutes = this.shifts
      .filter(shift => shift.actif)
      .reduce((somme, shift) => somme + (this.dureeMinutes(shift) * (shift.jours?.length || 0)), 0)
    return this.formatMinutes(minutes)
  }

  // ---------------------------------------------------------------- Affichage

  trackById(_index: number, shift: Shift): number | string {
    return shift.id ?? shift.nom
  }

  formatHeure(heure: string | undefined): string {
    if (!heure) return '—'
    return String(heure).slice(0, 5)
  }

  formatJours(jours: string[] | undefined): string {
    if (!jours || jours.length === 0) return '—'
    return jours.join(', ')
  }

  hasJour(shift: Shift, jour: string): boolean {
    return (shift.jours || []).includes(jour)
  }

  dureeMinutes(shift: Shift): number {
    const enMinutes = (heure: string | undefined): number | null => {
      if (!heure) return null
      const correspondance = String(heure).match(/(\d{1,2}):(\d{2})/)
      if (!correspondance) return null
      return Number(correspondance[1]) * 60 + Number(correspondance[2])
    }
    const debut = enMinutes(shift.heureDebut)
    const fin = enMinutes(shift.heureFin)
    if (debut === null || fin === null) return 0
    return fin >= debut ? fin - debut : (24 * 60 - debut) + fin
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '0h'
    const heures = Math.floor(minutes / 60)
    const reste = minutes % 60
    return `${heures}h${reste > 0 ? String(reste).padStart(2, '0') : ''}`
  }

  dureeShift(shift: Shift): string {
    return this.formatMinutes(this.dureeMinutes(shift))
  }

  estDeNuit(shift: Shift): boolean {
    if (!shift.heureDebut || !shift.heureFin) return false
    return String(shift.heureFin).slice(0, 5) < String(shift.heureDebut).slice(0, 5)
  }

  // ----------------------------------------------------------------- Actions

  editShift(id: number | undefined): void {
    if (id === undefined) return
    this.router.navigate(['/pointage/shifts', id])
  }

  nouvelleShift(): void {
    this.router.navigate(['/pointage/shifts/nouveau'])
  }

  toggleActif(shift: Shift): void {
    if (shift.id === undefined || this.toggleEnCours === shift.id) return
    this.toggleEnCours = shift.id
    this.shiftService.update(shift.id, { actif: !shift.actif }).subscribe({
      next: (res) => {
        shift.actif = res.actif
        this.toggleEnCours = null
        this.toastService.success(shift.actif ? 'Shift activé' : 'Shift désactivé')
      },
      error: (err) => {
        this.toggleEnCours = null
        this.toastService.error(err?.error?.message || 'Erreur lors de la mise à jour')
      }
    })
  }

  deleteShift(shift: Shift): void {
    if (shift.id === undefined) return
    if (!confirm(`Supprimer le shift « ${shift.nom} » ?`)) return
    this.deletingId = shift.id
    this.shiftService.delete(shift.id).subscribe({
      next: () => {
        this.shifts = this.shifts.filter(item => item.id !== shift.id)
        this.deletingId = null
        this.toastService.success('Shift supprimé')
      },
      error: (err) => {
        this.deletingId = null
        this.toastService.error(err?.error?.message || 'Erreur lors de la suppression')
      }
    })
  }
}
