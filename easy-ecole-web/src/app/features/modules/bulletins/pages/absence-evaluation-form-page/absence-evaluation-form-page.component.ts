import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AbsenceService } from '../../services/absence.service';

@Component({
  selector: 'app-absence-evaluation-form-page',
  templateUrl: './absence-evaluation-form-page.component.html',
  styleUrls: ['./absence-evaluation-form-page.component.scss']
})
export class AbsenceEvaluationFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  submitted = false;
  loading = false;

  types = ['justifiee', 'non_justifiee'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: AbsenceService
  ) {
    super();
    this.form = this.fb.group({
      noteEvaluationId: [null, Validators.required],
      type: ['', Validators.required],
      motif: [''],
      justifieLe: [''],
      justifiePar: [null],
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
    obs.subscribe(() => this.router.navigate(['/bulletins/absences']));
  }

  annuler(): void { this.router.navigate(['/bulletins/absences']); }
}
