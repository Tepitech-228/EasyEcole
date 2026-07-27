import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GedService, GedProcessus } from 'src/app/data/modules/ged/services/ged.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-processus-form',
  templateUrl: './processus-form.component.html',
  styleUrls: ['./processus-form.component.scss']
})
export class ProcessusFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  processId: number | null = null;
  saving = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private gedService: GedService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required]],
      libelle: ['', [Validators.required]],
      description: [''],
      moduleSource: [''],
      actif: [true]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.processId = Number(idParam);
      this.loadProcessus();
    }
  }

  loadProcessus(): void {
    if (!this.processId) return;
    this.loading = true;
    this.gedService.getProcessusById(this.processId).subscribe({
      next: (proc) => {
        this.form.patchValue(proc);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement du processus');
      }
    });
  }

  onCodeInput(): void {
    const code = this.form.get('code')?.value;
    if (code) {
      this.form.get('code')?.setValue(code.toUpperCase(), { emitEvent: false });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    this.saving = true;
    const data = this.form.value;

    const obs = this.isEdit
      ? this.gedService.updateProcessus(this.processId!, data)
      : this.gedService.createProcessus(data);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success(this.isEdit ? 'Processus modifié' : 'Processus créé');
        this.router.navigate(['/ged/processus']);
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.error?.message || 'Erreur lors de l\'enregistrement');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/ged/processus']);
  }
}
