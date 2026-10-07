import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ShiftService } from 'src/app/data/modules/inscription/services/shift.service';

@Component({
  selector: 'app-shift-form-page',
  templateUrl: './shift-form-page.component.html',
  styleUrls: ['./shift-form-page.component.scss']
})
export class ShiftFormPageComponent extends BaseComponentClass implements OnInit {
  isEdit: boolean = false
  saving: boolean = false
  success: boolean = false
  loading: boolean = false
  apiError: string = ''
  shiftId: number | null = null

  joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  form: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    heureDebut: new FormControl('', [Validators.required]),
    heureFin: new FormControl('', [Validators.required]),
    jours: new FormControl([], [Validators.required]),
    actif: new FormControl(true),
  })

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shiftService: ShiftService
  ) { super() }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true
        this.shiftId = Number(params['id'])
        this.loadShift(this.shiftId)
      }
    })
  }

  private loadShift(id: number): void {
    this.loading = true
    this.apiError = ''
    this.shiftService.get(id).subscribe({
      next: (shift) => {
        this.form.patchValue({
          nom: shift.nom,
          heureDebut: String(shift.heureDebut || '').slice(0, 5),
          heureFin: String(shift.heureFin || '').slice(0, 5),
          jours: shift.jours || [],
          actif: shift.actif ?? true,
        })
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.apiError = err?.error?.message || 'Shift introuvable'
      }
    })
  }

  toggleJour(jour: string): void {
    const jours = this.form.get('jours')?.value as string[]
    if (jours.includes(jour)) {
      this.form.patchValue({ jours: jours.filter((j: string) => j !== jour) })
    } else {
      this.form.patchValue({ jours: [...jours, jour] })
    }
  }

  save(): void {
    if (this.form.invalid || this.saving) return
    this.saving = true
    this.apiError = ''
    this.success = false
    const payload = {
      nom: String(this.form.value.nom).trim(),
      heureDebut: this.form.value.heureDebut,
      heureFin: this.form.value.heureFin,
      jours: this.form.value.jours,
      actif: !!this.form.value.actif,
    }
    const request = this.isEdit && this.shiftId !== null
      ? this.shiftService.update(this.shiftId, payload)
      : this.shiftService.create(payload)
    request.subscribe({
      next: () => {
        this.saving = false
        this.success = true
        setTimeout(() => this.router.navigate(['/pointage/shifts']), 1500)
      },
      error: (err) => {
        this.saving = false
        this.apiError = err?.error?.message || "Erreur lors de l'enregistrement"
      }
    })
  }
}
