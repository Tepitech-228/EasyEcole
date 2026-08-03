import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { RhDepartementService } from 'src/app/data/modules/rh/services/rh-departement.service';
import { RhPosteService } from 'src/app/data/modules/rh/services/rh-poste.service';

// Statut employé — valeurs exactes de l'ENUM backend (RhEmploye.statut) :
// ENUM('actif', 'suspendu', 'quitté')  (vérifié dans lib/modules/rh/models/RhEmploye.js)
export const EMPLOYE_STATUTS: string[] = ['actif', 'suspendu', 'quitté'];

@Component({
  selector: 'app-liste-employes-page',
  templateUrl: './liste-employes-page.component.html',
  styleUrls: ['./liste-employes-page.component.scss']
})
export class ListeEmployesPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  employes: any[] = [];
  departements: any[] = [];
  postes: any[] = [];
  showModal = false;
  isEditing = false;
  form!: FormGroup;
  /** Employé en cours d'édition — permet de récupérer son id au moment du PUT. */
  employeEnEdition: any = null;
  searchTerm = '';
  filterDepartement = '';

  constructor(
    private service: RhEmployeService,
    private departementService: RhDepartementService,
    private posteService: RhPosteService,
    private fb: FormBuilder
  ) { super() }

  ngOnInit(): void {
    this.initForm();
    this.loadReferentiel();
    this.loadEmployes();
  }

  private initForm(): void {
    this.form = this.fb.group({
      matricule: ['', Validators.required],
      nom: ['', Validators.required],
      prenoms: ['', Validators.required],
      posteId: [null],
      departementId: [null],
      typeContratId: [null],
      statut: ['actif', Validators.required],
      dateEmbauche: [new Date().toISOString().slice(0, 10)],
      salaireBase: [0]
    });
  }

  private loadReferentiel(): void {
    this.departementService.getAll().subscribe({
      next: (data) => { this.departements = data; },
      error: () => { this.departements = []; }
    });
    this.posteService.getAll().subscribe({
      next: (data) => { this.postes = data; },
      error: () => { this.postes = []; }
    });
  }

  closeModal() {
    this.showModal = false;
    this.form.reset({ statut: 'actif' });
    this.employeEnEdition = null;
  }

  loadEmployes() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.employes = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openCreate() {
    this.isEditing = false;
    this.employeEnEdition = null;
    this.form.reset({ statut: 'actif' });
    this.showModal = true;
  }

  openEdit(emp: any) {
    this.isEditing = true;
    this.employeEnEdition = emp;
    this.form.patchValue({
      matricule: emp.matricule || '',
      nom: emp.nom || '',
      prenoms: emp.prenoms || '',
      posteId: emp.posteId ?? emp.poste?.id ?? null,
      departementId: emp.departementId ?? emp.departement?.id ?? null,
      typeContratId: emp.typeContratId ?? null,
      statut: emp.statut || 'actif',
      dateEmbauche: emp.dateEmbauche || new Date().toISOString().slice(0, 10),
      salaireBase: emp.salaireBase || 0
    });
    this.showModal = true;
  }

  onSubmit() {
    if (this.form.invalid) return;

    // MAPPE les contrôles du formulaire sur le modèle backend RhEmploye.
    // Champs acceptés par le modèle : utilisateurId, posteId, departementId,
    // dateEmbauche, typeContratId, salaireBase, statut. Les colonnes
    // matricule / nom / prenoms sont ajoutées côté backend en parallèle.
    const payload: any = {
      utilisateurId: 1,
      posteId: this.form.value.posteId || null,
      departementId: this.form.value.departementId || null,
      dateEmbauche: this.form.value.dateEmbauche,
      typeContratId: this.form.value.typeContratId || null,
      salaireBase: Number(this.form.value.salaireBase) || 0,
      statut: this.form.value.statut,
      matricule: this.form.value.matricule,
      nom: this.form.value.nom,
      prenoms: this.form.value.prenoms
    };

    if (this.isEditing) {
      // L'id est celui de l'employé conservé au moment de l'ouverture du modal.
      this.service.update({ ...payload, id: this.employeEnEdition?.id }).subscribe({
        next: () => this.loadEmployes(),
        error: () => this.loadEmployes()
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => this.loadEmployes(),
        error: () => this.loadEmployes()
      });
    }

    this.showModal = false;
  }

  deleteItem(id: number) {
    if (confirm('Supprimer cet employé ?')) {
      this.service.delete(String(id)).subscribe({
        next: () => this.loadEmployes(),
        error: () => this.loadEmployes()
      });
    }
  }

  get filteredEmployes(): any[] {
    return this.employes.filter((emp: any) => {
      const matchesText = `${emp.nom || ''} ${emp.prenoms || ''} ${emp.matricule || ''}`.toLowerCase().includes(this.searchTerm.toLowerCase());
      const deptName = emp.departement?.nom || emp.departement || '';
      const matchesDept = !this.filterDepartement || deptName.toLowerCase() === this.filterDepartement.toLowerCase();
      return matchesText && matchesDept;
    });
  }

  get distinctDepartements(): string[] {
    return Array.from(new Set(this.employes.map((emp: any) => emp.departement?.nom || emp.departement || '').filter(Boolean))).sort();
  }

  getStatutBadge(statut: string): string {
    const map: any = { actif: 'bg-green-100 text-green-700', suspendu: 'bg-red-100 text-red-700', 'quitté': 'bg-yellow-100 text-yellow-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }
}
