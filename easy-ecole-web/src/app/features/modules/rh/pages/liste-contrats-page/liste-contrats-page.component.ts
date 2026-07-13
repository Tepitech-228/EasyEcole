import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhContratEnseignantService } from 'src/app/data/modules/rh/services/rh-contrat-enseignant.service';

@Component({
  selector: 'app-liste-contrats-page',
  templateUrl: './liste-contrats-page.component.html',
  styleUrls: ['./liste-contrats-page.component.scss']
})
export class ListeContratsPageComponent extends BaseComponentClass implements OnInit {
  contrats: any[] = [];
  loading: boolean = true;
  showModal: boolean = false;
  isEditing: boolean = false;
  selectedId: number | null = null;
  form: FormGroup;

  constructor(
    private contratService: RhContratEnseignantService,
    private fb: FormBuilder
  ) {
    super();
    this.form = this.fb.group({
      employeId: ['', Validators.required],
      typeContrat: ['cdd', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: [null],
      statut: ['brouillon'],
      montantMensuel: [null],
      tauxHoraire: [null],
      volumeHoraireMensuel: [null],
      description: [null],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.contratService.getAll().subscribe({
      next: (data) => { this.contrats = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  openCreate(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.form.reset({ typeContrat: 'cdd', statut: 'brouillon' });
    this.showModal = true;
  }

  openEdit(item: any): void {
    this.isEditing = true;
    this.selectedId = item.id;
    this.form.patchValue(item);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.value;
    if (this.isEditing && this.selectedId) {
      this.contratService.update(this.selectedId, data).subscribe({
        next: () => { this.closeModal(); this.loadData(); }
      });
    } else {
      this.contratService.create(data).subscribe({
        next: () => { this.closeModal(); this.loadData(); }
      });
    }
  }

  deleteItem(id: number): void {
    if (confirm('Supprimer ce contrat ?')) {
      this.contratService.delete(id).subscribe({ next: () => this.loadData() });
    }
  }

  resilier(id: number): void {
    if (confirm('Résilier ce contrat ?')) {
      this.contratService.resilier(id).subscribe({ next: () => this.loadData() });
    }
  }

  activer(id: number): void {
    this.contratService.activer(id).subscribe({ next: () => this.loadData() });
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'brouillon': 'bg-gray-100 text-gray-600',
      'actif': 'bg-emerald-100 text-emerald-700',
      'resilie': 'bg-red-100 text-red-700',
    };
    return map[statut] || 'bg-gray-100 text-gray-600';
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'cdi': 'CDI',
      'cdd': 'CDD',
      'vacataire': 'Vacataire',
    };
    return map[type] || type;
  }
}
