import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SessionExamenService } from '../../services/session-examen.service';

@Component({
  selector: 'app-session-examen-form-page',
  templateUrl: './session-examen-form-page.component.html',
  styleUrls: ['./session-examen-form-page.component.scss']
})
export class SessionExamenFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  submitted = false;
  loading = false;

  types = ['normale', 'rattrapage'];
  semestres = ['semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'];
  statuts = ['planifiee', 'en_cours', 'terminee', 'cloturee'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: SessionExamenService
  ) {
    super();
    this.form = this.fb.group({
      libelle: ['', Validators.required],
      type: ['', Validators.required],
      classeId: [null, Validators.required],
      anneeAcademiqueId: [null, Validators.required],
      semestre: ['', Validators.required],
      dateDebut: [''],
      dateFin: [''],
      statut: ['planifiee'],
      observations: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.itemId = Number(id);
      this.loading = true;
      this.service.getOne(this.itemId).subscribe({
        next: (res) => { this.form.patchValue(res); this.loading = false; },
        error: () => { this.loading = false; }
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    const obs = this.isEditMode
      ? this.service.update(this.itemId!, this.form.value)
      : this.service.create(this.form.value);
    obs.subscribe(() => this.router.navigate(['/bulletins/sessions']));
  }

  annuler(): void { this.router.navigate(['/bulletins/sessions']); }
}
