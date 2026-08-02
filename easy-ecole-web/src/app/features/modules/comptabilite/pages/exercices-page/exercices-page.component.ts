import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ExerciceComptable } from 'src/app/data/modules/comptabilite/models/Comptabilite.model';
import { ComptabiliteService } from 'src/app/data/modules/comptabilite/services/comptabilite.service';

@Component({
  selector: 'app-exercices-page',
  templateUrl: './exercices-page.component.html',
  styleUrls: ['./exercices-page.component.scss']
})
export class ExercicesPageComponent extends BaseComponentClass implements OnInit {
  exercices: ExerciceComptable[] = [];
  loading = true;
  error = false;
  showModal = false;
  isEditing = false;
  selectedExercice: ExerciceComptable | null = null;
  submitting = false;
  submitError = '';

  exerciceForm: FormGroup;

  constructor(
    private service: ComptabiliteService,
    private fb: FormBuilder
  ) {
    super();

    this.exerciceForm = this.fb.group({
      code: ['', Validators.required],
      libelle: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadExercices();
  }

  loadExercices(): void {
    this.loading = true;
    this.error = false;
    this.service.getAllExercices().subscribe({
      next: (data) => {
        this.exercices = data;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedExercice = null;
    this.exerciceForm.reset();
    this.submitError = '';
    this.showModal = true;
  }

  openEditModal(exercice: ExerciceComptable): void {
    this.isEditing = true;
    this.selectedExercice = exercice;
    this.submitError = '';
    this.exerciceForm.patchValue({
      code: exercice.code,
      libelle: exercice.libelle,
      dateDebut: exercice.dateDebut,
      dateFin: exercice.dateFin,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedExercice = null;
    this.submitError = '';
  }

  onSubmit(): void {
    if (this.exerciceForm.invalid) {
      this.exerciceForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitError = '';
    const data = this.exerciceForm.value;

    if (this.isEditing && this.selectedExercice) {
      this.service.updateExercice(this.selectedExercice.id, data).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.loadExercices();
        },
        error: (err) => {
          this.submitting = false;
          this.submitError = err.error?.message || 'Erreur lors de la modification de l\'exercice';
        }
      });
    } else {
      this.service.createExercice(data).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.loadExercices();
        },
        error: (err) => {
          this.submitting = false;
          this.submitError = err.error?.message || 'Erreur lors de la création de l\'exercice';
        }
      });
    }
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'Ouvert': return 'bg-emerald-100 text-emerald-700';
      case 'En cours de clôture': return 'bg-amber-100 text-amber-700';
      case 'Clôturé': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  formatDate(date?: string | null): string {
    if (!date) return '-';
    // Parse 'YYYY-MM-DD' en heure locale pour éviter le décalage UTC J-1.
    const parts = date.split('-');
    if (parts.length === 3) {
      const [y, m, day] = parts.map(Number);
      return new Date(y, m - 1, day).toLocaleDateString('fr-FR');
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString('fr-FR');
  }
}
