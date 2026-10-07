import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { Shift } from 'src/app/data/modules/inscription/models/Shift.model';
import { ShiftService } from 'src/app/data/modules/inscription/services/shift.service';

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

  constructor(
    private router: Router,
    private shiftService: ShiftService,
    private toastService: ToastService
  ) { super() }

  ngOnInit(): void {
    this.loadShifts()
  }

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

  formatHeure(h: string | undefined): string {
    if (!h) return '—'
    return String(h).slice(0, 5)
  }

  formatJours(jours: string[] | undefined): string {
    if (!jours || jours.length === 0) return '—'
    return jours.join(', ')
  }

  editShift(id: number | undefined): void {
    if (id === undefined) return
    this.router.navigate(['/pointage/shifts', id])
  }

  nouvelleShift(): void {
    this.router.navigate(['/pointage/shifts/nouveau'])
  }

  toggleActif(shift: Shift): void {
    if (shift.id === undefined) return
    this.shiftService.update(shift.id, { actif: !shift.actif }).subscribe({
      next: (res) => {
        shift.actif = res.actif
        this.toastService.success(shift.actif ? 'Shift activé' : 'Shift désactivé')
      },
      error: (err) => {
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
        this.shifts = this.shifts.filter(s => s.id !== shift.id)
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
