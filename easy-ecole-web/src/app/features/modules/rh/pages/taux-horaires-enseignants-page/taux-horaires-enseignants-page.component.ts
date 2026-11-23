import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { TauxHoraireEnseignant, RhTauxHoraireEnseignantService } from 'src/app/data/modules/rh/services/rh-taux-horaire-enseignant.service';

@Component({
  selector: 'app-taux-horaires-enseignants-page',
  templateUrl: './taux-horaires-enseignants-page.component.html'
})
export class TauxHorairesEnseignantsPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  saving = false;
  errorMessage = '';
  rates: TauxHoraireEnseignant[] = [];
  niveaux: any[] = [];
  cours: any[] = [];
  enseignants: any[] = [];
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: RhTauxHoraireEnseignantService
  ) {
    super();
    this.form = this.fb.group({
      niveauEtudeId: [null, Validators.required],
      coursId: [null, Validators.required],
      enseignantId: [null],
      tauxHoraire: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.getOptions().subscribe({
      next: options => {
        this.niveaux = options.niveaux || [];
        this.cours = options.cours || [];
        this.enseignants = options.enseignants || [];
        this.service.getAll().subscribe({
          next: rates => {
            this.rates = rates || [];
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Les taux enregistrés n’ont pas pu être chargés.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Les niveaux, cours et enseignants n’ont pas pu être chargés.';
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.errorMessage = '';
    const value = this.form.getRawValue();
    this.service.save({
      niveauEtudeId: Number(value.niveauEtudeId),
      coursId: Number(value.coursId),
      enseignantId: value.enseignantId ? Number(value.enseignantId) : null,
      tauxHoraire: Number(value.tauxHoraire)
    }).subscribe({
      next: () => {
        this.saving = false;
        this.load();
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Le taux n’a pas pu être enregistré.';
        this.saving = false;
      }
    });
  }

  delete(rate: TauxHoraireEnseignant): void {
    if (!confirm('Supprimer ce taux horaire ?')) return;
    this.service.delete(rate.id).subscribe({
      next: () => this.load(),
      error: err => { this.errorMessage = err.error?.message || 'Le taux n’a pas pu être supprimé.'; }
    });
  }

  niveauLabel(id: number): string {
    return this.niveaux.find(item => Number(item.id) === Number(id))?.libelle || `Niveau #${id}`;
  }

  coursLabel(id: number): string {
    const item = this.cours.find(cours => Number(cours.id) === Number(id));
    return item ? `${item.code} - ${item.intitule}` : `Cours #${id}`;
  }

  enseignantLabel(id: number | null): string {
    if (id === null) return 'Taux général';
    return this.enseignants.find(item => Number(item.id) === Number(id))?.nomComplet || `Enseignant #${id}`;
  }
}
