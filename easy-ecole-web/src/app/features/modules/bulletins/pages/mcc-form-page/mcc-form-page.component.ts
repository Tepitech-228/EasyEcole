import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { MccService } from '../../services/mcc.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';

@Component({
  selector: 'app-mcc-form-page',
  templateUrl: './mcc-form-page.component.html',
  styleUrls: ['./mcc-form-page.component.scss']
})
export class MccFormPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  submitted = false;
  loading = false;
  ueList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: MccService,
    private coursService: CoursService
  ) {
    super();
    this.form = this.fb.group({
      coursId: [null, Validators.required],
      coefficient: [1, [Validators.required, Validators.min(0.5)]],
      creditEcts: [0],
    });
  }

  ngOnInit(): void {
    this.coursService.getAll().subscribe({
      next: (res) => { this.ueList = res; },
      error: () => {}
    });

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
    obs.subscribe(() => this.router.navigate(['/bulletins/parametres-notation']));
  }

  annuler(): void { this.router.navigate(['/bulletins/parametres-notation']); }
}
