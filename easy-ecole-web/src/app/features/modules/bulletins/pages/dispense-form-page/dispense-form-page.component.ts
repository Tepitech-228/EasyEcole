import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DispenseService } from '../../services/dispense.service';

@Component({
  selector: 'app-dispense-form-page',
  templateUrl: './dispense-form-page.component.html',
  styleUrls: ['./dispense-form-page.component.scss']
})
export class DispenseFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  dispenseId: number | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: DispenseService,
  ) {
    super();
    this.form = this.fb.group({
      etudiantNom: ['', Validators.required],
      matiereLibelle: ['', Validators.required],
      statut: ['en_attente', Validators.required],
      motif: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.dispenseId = Number(id);
      this.service.getOne(this.dispenseId).subscribe({
        next: (res) => this.form.patchValue(res),
        error: () => this.router.navigate(['/bulletins/dispenses'])
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const obs = this.isEditMode
      ? this.service.update(this.dispenseId!, this.form.value)
      : this.service.create(this.form.value);

    obs.subscribe({
      next: () => this.router.navigate(['/bulletins/dispenses']),
      error: () => {}
    });
  }

  annuler(): void {
    this.router.navigate(['/bulletins/dispenses']);
  }
}
