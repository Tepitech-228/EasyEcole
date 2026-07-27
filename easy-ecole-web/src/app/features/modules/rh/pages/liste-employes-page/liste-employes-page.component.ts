import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-employes-page',
  templateUrl: './liste-employes-page.component.html',
  styleUrls: ['./liste-employes-page.component.scss']
})
export class ListeEmployesPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  employes: any[] = [];
  showModal = false;
  isEditing = false;
  form: any = {};
  searchTerm = '';
  filterDepartement = '';

  constructor() { super() }

  ngOnInit(): void {
    this.loadEmployes();
  }

  closeModal() {
    this.showModal = false;
  }

  loadEmployes() {
    this.loading = true;
    setTimeout(() => {
      this.employes = [
        { id: 1, matricule: 'EMP001', nom: 'Dupont', prenoms: 'Jean', poste: 'Développeur', departement: 'IT', statut: 'actif' },
        { id: 2, matricule: 'EMP002', nom: 'Martin', prenoms: 'Marie', poste: 'Comptable', departement: 'Finance', statut: 'actif' },
      ];
      this.loading = false;
    }, 500);
  }

  openCreate() {
    this.isEditing = false;
    this.form = { matricule: '', nom: '', prenoms: '', poste: '', departement: '', statut: 'actif' };
    this.showModal = true;
  }

  openEdit(emp: any) {
    this.isEditing = true;
    this.form = { ...emp };
    this.showModal = true;
  }

  onSubmit() {
    if (this.isEditing) {
      const idx = this.employes.findIndex(e => e.id === this.form.id);
      if (idx > -1) this.employes[idx] = { ...this.employes[idx], ...this.form };
    } else {
      this.employes.push({ ...this.form, id: Date.now() });
    }
    this.showModal = false;
  }

  deleteItem(id: number) {
    if (confirm('Supprimer cet employé ?')) {
      this.employes = this.employes.filter(e => e.id !== id);
    }
  }

  getStatutBadge(statut: string): string {
    const map: any = { actif: 'bg-green-100 text-green-700', inactif: 'bg-red-100 text-red-700', conge: 'bg-yellow-100 text-yellow-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }
}
