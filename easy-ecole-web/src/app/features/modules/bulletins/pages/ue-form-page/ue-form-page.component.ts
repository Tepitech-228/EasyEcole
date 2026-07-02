import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { UniteEnseignementService } from '../../services/unite-enseignement.service';

@Component({
  selector: 'app-ue-form-page',
  templateUrl: './ue-form-page.component.html',
  styleUrls: ['./ue-form-page.component.scss']
})
export class UeFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  submitted = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: UniteEnseignementService
  ) {
    super();
    this.form = this.fb.group({
      code: ['', Validators.required],
      libelle: ['', Validators.required],
      semestre: ['semestre1', Validators.required],
      parcoursId: [null, Validators.required],
      creditEcts: [0],
      objectifs: [''],
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
    obs.subscribe(() => this.router.navigate(['/bulletins/ues']));
  }

  annuler(): void { this.router.navigate(['/bulletins/ues']); }
}
