import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-echelle-form-page',
  templateUrl: './echelle-form-page.component.html',
  styleUrls: ['./echelle-form-page.component.scss']
})
export class EchelleFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode: boolean = false;
  echelleId: number | null = null;
  submitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    super();
    this.form = this.fb.group({
      nom: ['', Validators.required],
      noteMin: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
      noteMax: [20, [Validators.required, Validators.min(0), Validators.max(20)]],
      mention: ['', Validators.required],
      actif: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.echelleId = Number(id);
      this.form.patchValue({
        nom: 'Très bien',
        noteMin: 16,
        noteMax: 17.99,
        mention: 'Bien',
        actif: true,
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.router.navigate(['/bulletins/echelles']);
  }

  annuler(): void {
    this.router.navigate(['/bulletins/echelles']);
  }
}
