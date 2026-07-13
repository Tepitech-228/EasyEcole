import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EquivalenceService } from '../../services/equivalence.service';

@Component({
  selector: 'app-equivalence-form-page',
  templateUrl: './equivalence-form-page.component.html',
  styleUrls: ['./equivalence-form-page.component.scss']
})
export class EquivalenceFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  equivalenceId: number | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: EquivalenceService,
  ) {
    super();
    this.form = this.fb.group({
      libelle: ['', Validators.required],
      noteSource: [null, [Validators.required, Validators.min(0), Validators.max(20)]],
      noteCible: [null, [Validators.required, Validators.min(0), Validators.max(20)]],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.equivalenceId = Number(id);
      this.service.getOne(this.equivalenceId).subscribe({
        next: (res) => this.form.patchValue(res),
        error: () => this.router.navigate(['/bulletins/equivalences'])
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const obs = this.isEditMode
      ? this.service.update(this.equivalenceId!, this.form.value)
      : this.service.create(this.form.value);

    obs.subscribe({
      next: () => this.router.navigate(['/bulletins/equivalences']),
      error: () => {}
    });
  }

  annuler(): void {
    this.router.navigate(['/bulletins/equivalences']);
  }
}
