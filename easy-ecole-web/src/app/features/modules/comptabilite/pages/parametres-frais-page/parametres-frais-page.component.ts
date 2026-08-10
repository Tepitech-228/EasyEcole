import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ParametreFrais, TypeParametreFrais } from 'src/app/data/modules/comptabilite/models/ParametreFrais.model';
import { ParametreFraisService } from 'src/app/data/modules/comptabilite/services/parametre-frais.service';

@Component({
  selector: 'app-parametres-frais-page',
  templateUrl: './parametres-frais-page.component.html',
  styleUrls: ['./parametres-frais-page.component.scss']
})
export class ParametresFraisPageComponent extends BaseComponentClass implements OnInit {
  parametres: ParametreFrais[] = [];
  filteredParametres: ParametreFrais[] = [];
  loading = true;
  error = false;

  // Modal création / édition
  showModal = false;
  isEditing = false;
  selectedParametre: ParametreFrais | null = null;
  submitting = false;
  submitError = '';

  // Modal suppression
  showDeleteModal = false;
  parametreToDelete: ParametreFrais | null = null;
  deleting = false;

  // Filtres
  filterModule = '';
  filterType = '';

  parametreForm: FormGroup;

  readonly types: { value: TypeParametreFrais; label: string }[] = [
    { value: 'montant', label: 'Montant' },
    { value: 'compte_comptable', label: 'Compte comptable' },
    { value: 'pourcentage', label: 'Pourcentage' },
    { value: 'texte', label: 'Texte' },
  ];

  readonly moduleOptions: string[] = [
    'scolarite',
    'evaluations',
    'inscription',
    'rh',
    'bibliotheque',
    'autre',
  ];

  constructor(
    private service: ParametreFraisService,
    private fb: FormBuilder,
    private router: Router
  ) {
    super();

    this.parametreForm = this.fb.group({
      cle: ['', Validators.required],
      libelle: ['', Validators.required],
      valeur: [0, Validators.required],
      type: ['montant', Validators.required],
      module: ['scolarite', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    // Page réservée à l'administrateur
    if (!this.rolesValue.isAdmin) {
      this.router.navigate(['/comptabilite/dashboard']);
      return;
    }
    this.loadParametres();
  }

  loadParametres(): void {
    this.loading = true;
    this.error = false;
    this.service.getAll().subscribe({
      next: (data) => {
        this.parametres = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredParametres = this.parametres.filter(p => {
      const matchModule = !this.filterModule || (p.module || '') === this.filterModule;
      const matchType = !this.filterType || p.type === this.filterType;
      return matchModule && matchType;
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedParametre = null;
    this.submitError = '';
    this.parametreForm.reset({
      cle: '',
      libelle: '',
      valeur: 0,
      type: 'montant',
      module: 'scolarite',
      description: '',
    });
    this.showModal = true;
  }

  openEditModal(parametre: ParametreFrais): void {
    this.isEditing = true;
    this.selectedParametre = parametre;
    this.submitError = '';
    this.parametreForm.patchValue({
      cle: parametre.cle,
      libelle: parametre.libelle,
      valeur: parametre.valeur,
      type: parametre.type,
      module: parametre.module || 'scolarite',
      description: parametre.description || '',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedParametre = null;
    this.submitError = '';
  }

  onSubmit(): void {
    if (this.parametreForm.invalid) {
      this.parametreForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitError = '';
    const data = this.parametreForm.value;

    if (this.isEditing && this.selectedParametre?.id) {
      this.service.update(this.selectedParametre.id, data).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.loadParametres();
        },
        error: (err) => {
          this.submitting = false;
          this.submitError = err.error?.message || 'Erreur lors de la modification du paramètre';
        }
      });
    } else {
      this.service.create(data).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.loadParametres();
        },
        error: (err) => {
          this.submitting = false;
          this.submitError = err.error?.message || 'Erreur lors de la création du paramètre';
        }
      });
    }
  }

  confirmDelete(parametre: ParametreFrais): void {
    this.parametreToDelete = parametre;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.parametreToDelete = null;
  }

  deleteParametre(): void {
    if (!this.parametreToDelete?.id) return;
    this.deleting = true;
    this.service.delete(this.parametreToDelete.id).subscribe({
      next: () => {
        this.deleting = false;
        this.closeDeleteModal();
        this.loadParametres();
      },
      error: () => {
        this.deleting = false;
        this.closeDeleteModal();
      }
    });
  }

  typeLabel(type: string): string {
    return this.types.find(t => t.value === type)?.label || type;
  }

  moduleLabel(module: string | null | undefined): string {
    switch (module) {
      case 'scolarite': return 'Scolarité';
      case 'evaluations': return 'Évaluations';
      case 'inscription': return 'Inscription';
      case 'rh': return 'Ressources humaines';
      case 'bibliotheque': return 'Bibliothèque';
      case 'autre': return 'Autre';
      default: return module || '—';
    }
  }

  formatValeur(p: ParametreFrais): string {
    if (p.type === 'montant') {
      return `${p.valeur.toLocaleString('fr-FR')} FC`;
    }
    if (p.type === 'pourcentage') {
      return `${p.valeur} %`;
    }
    return String(p.valeur);
  }

  get typeBadgeClass(): Record<TypeParametreFrais, string> {
    return {
      'montant': 'bg-emerald-100 text-emerald-700',
      'compte_comptable': 'bg-blue-100 text-blue-700',
      'pourcentage': 'bg-purple-100 text-purple-700',
      'texte': 'bg-gray-100 text-gray-700',
    };
  }
}
