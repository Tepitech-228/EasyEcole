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
  saving = false;
  loadFailed = false;
  errorMessage = '';

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
        error: () => {
          this.loadFailed = true;
          this.errorMessage = 'Impossible de charger cette échelle. Vous ne pouvez pas la modifier tant que le chargement a échoué.';
        }
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid || this.loadFailed) return;
    if (Number(this.form.value.noteMin) > Number(this.form.value.noteMax)) {
      this.errorMessage = 'La note minimale doit être inférieure ou égale à la note maximale.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const obs = this.isEditMode
      ? this.service.update(this.echelleId!, this.form.value)
      : this.service.create(this.form.value);

    obs.subscribe({
      next: () => this.router.navigate(['/bulletins/parametres-notation']),
      error: () => {
        this.errorMessage = 'L’échelle n’a pas pu être enregistrée. Vérifiez les valeurs puis réessayez.';
        this.saving = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/bulletins/parametres-notation']);
  }
}
