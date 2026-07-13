import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-shift-form-page',
  templateUrl: './shift-form-page.component.html',
  styleUrls: ['./shift-form-page.component.scss']
})
export class ShiftFormPageComponent extends BaseComponentClass implements OnInit {
  isEdit: boolean = false
  saving: boolean = false
  success: boolean = false
  shiftId: number | null = null

  joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  form: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    heureDebut: new FormControl('', [Validators.required]),
    heureFin: new FormControl('', [Validators.required]),
    jours: new FormControl([], [Validators.required]),
    actif: new FormControl(true),
  })

  constructor(private route: ActivatedRoute, private router: Router) { super() }

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
    if (this.form.invalid) return
    this.saving = true
    setTimeout(() => {
      this.saving = false
      this.success = true
      setTimeout(() => this.router.navigate(['/modules/pointage/shifts']), 1500)
    }, 1000)
  }
}
