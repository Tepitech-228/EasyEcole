import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { JuryMembreService } from '../../services/jury-membre.service';

@Component({
  selector: 'app-jury-membre-form-page',
  templateUrl: './jury-membre-form-page.component.html',
  styleUrls: ['./jury-membre-form-page.component.scss']
})
export class JuryMembreFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  membreId: number | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: JuryMembreService,
  ) {
    super();
    this.form = this.fb.group({
      deliberationId: [null, Validators.required],
      utilisateurId: [null, Validators.required],
      role: ['membre', Validators.required],
      presence: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.membreId = Number(id);
      this.service.getOne(this.membreId).subscribe({
        next: (res) => this.form.patchValue(res),
        error: () => this.router.navigate(['/bulletins/jury'])
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const obs = this.isEditMode
      ? this.service.update(this.membreId!, this.form.value)
      : this.service.create(this.form.value);

    obs.subscribe({
      next: () => this.router.navigate(['/bulletins/jury']),
      error: () => {}
    });
  }

  annuler(): void {
    this.router.navigate(['/bulletins/jury']);
  }
}
