import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhFormation } from 'src/app/data/modules/rh/models/RhFormation.model';
import { RhFormationService } from 'src/app/data/modules/rh/services/rh-formation.service';

// Type de formation — valeurs exactes de l'ENUM backend (RhFormation.type)
export const FORMATION_TYPES: string[] = ['interne', 'externe'];

@Component({
  selector: 'app-liste-formations-page',
  templateUrl: './liste-formations-page.component.html',
  styleUrls: ['./liste-formations-page.component.scss']
})
export class ListeFormationsPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  formations: RhFormation[] = [];
  searchTerm = '';

  showModal = false;
  isEditing = false;
  formationEnEdition: RhFormation | null = null;
  form!: FormGroup;

  types = FORMATION_TYPES;

  constructor(
    private service: RhFormationService,
    private fb: FormBuilder
  ) { super() }

  ngOnInit(): void {
    this.initForm();
    this.loadFormations();
  }

  private initForm(): void {
    this.form = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      dateDebut: [new Date().toISOString().slice(0, 10), Validators.required],
      dateFin: [new Date().toISOString().slice(0, 10), Validators.required],
      formateur: ['', Validators.required],
      type: ['interne', Validators.required]
    });
  }

  loadFormations() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.formations = data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openCreate() {
    this.isEditing = false;
    this.formationEnEdition = null;
    this.form.reset({ type: 'interne', dateDebut: new Date().toISOString().slice(0, 10), dateFin: new Date().toISOString().slice(0, 10) });
    this.showModal = true;
  }

  openEdit(f: RhFormation) {
    this.isEditing = true;
    this.formationEnEdition = f;
    this.form.patchValue({
      titre: f.titre || '',
      description: f.description || '',
      dateDebut: f.dateDebut || new Date().toISOString().slice(0, 10),
      dateFin: f.dateFin || new Date().toISOString().slice(0, 10),
      formateur: f.formateur || '',
      type: f.type || 'interne'
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.form.reset({ type: 'interne' });
    this.formationEnEdition = null;
  }

  onSubmit() {
    if (this.form.invalid) return;

    const payload: RhFormation = {
      titre: this.form.value.titre,
      description: this.form.value.description || null,
      dateDebut: this.form.value.dateDebut,
      dateFin: this.form.value.dateFin,
      formateur: this.form.value.formateur,
      type: this.form.value.type
    };

    if (this.isEditing) {
      this.service.update({ ...payload, id: this.formationEnEdition?.id }).subscribe({
        next: () => { this.loadFormations(); this.closeModal(); },
        error: () => this.loadFormations()
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => { this.loadFormations(); this.closeModal(); },
        error: () => this.loadFormations()
      });
    }
  }

  deleteItem(id: string) {
    if (confirm('Supprimer cette formation ?')) {
      this.service.delete(id).subscribe({
        next: () => this.loadFormations(),
        error: () => this.loadFormations()
      });
    }
  }

  /** Nombre de participants issus des participations incluses par le backend. */
  participantCount(f: RhFormation): number {
    return f.participations?.length || 0;
  }

  get filteredFormations(): RhFormation[] {
    return this.formations.filter((f) =>
      `${f.titre || ''} ${f.formateur || ''}`.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getTypeBadge(type: string): string {
    const map: any = { interne: 'bg-indigo-100 text-indigo-700', externe: 'bg-teal-100 text-teal-700' };
    return map[type] || 'bg-gray-100 text-gray-700';
  }
}