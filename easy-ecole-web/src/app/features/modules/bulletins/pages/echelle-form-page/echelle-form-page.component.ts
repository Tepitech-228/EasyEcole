import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EchelleNoteService } from '../../services/echelle-note.service';

@Component({
  selector: 'app-echelle-form-page',
  templateUrl: './echelle-form-page.component.html',
  styleUrls: ['./echelle-form-page.component.scss']
})
export class EchelleFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  echelleId: number | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: EchelleNoteService,
  ) {
    super();
    this.form = this.fb.group({
      libelle: ['', Validators.required],
      noteMin: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
      noteMax: [20, [Validators.required, Validators.min(0), Validators.max(20)]],
      mention: ['', Validators.required],
      ordre: [0],
      estActive: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.echelleId = Number(id);
      this.service.getOne(this.echelleId).subscribe({
        next: (res) => this.form.patchValue(res),
        error: () => this.router.navigate(['/bulletins/echelles'])
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const obs = this.isEditMode
      ? this.service.update(this.echelleId!, this.form.value)
      : this.service.create(this.form.value);

    obs.subscribe({
      next: () => this.router.navigate(['/bulletins/echelles']),
      error: () => {}
    });
  }

  annuler(): void {
    this.router.navigate(['/bulletins/echelles']);
  }
}
