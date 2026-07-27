import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-liste-offres-page',
  templateUrl: './liste-offres-page.component.html',
  styleUrls: ['./liste-offres-page.component.scss']
})
export class ListeOffresPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  offres: any[] = [];
  showModal = false;
  isEditing = false;
  form: any = {};

  constructor() { super() }

  ngOnInit(): void {
    this.loadOffres();
  }

  loadOffres() {
    this.loading = true;
    setTimeout(() => {
      this.offres = [
        { id: 1, poste: 'Développeur Angular', datePublication: '2026-01-15', dateCloture: '2026-02-15', statut: 'ouverte', candidatures: 8 },
        { id: 2, poste: 'Comptable', datePublication: '2026-01-20', dateCloture: '2026-02-20', statut: 'ouverte', candidatures: 5 },
      ];
      this.loading = false;
    }, 500);
  }

  openCreate() {
    this.isEditing = false;
    this.form = { poste: '', datePublication: '', dateCloture: '', statut: 'ouverte', description: '' };
    this.showModal = true;
  }

  openEdit(offre: any) {
    this.isEditing = true;
    this.form = { ...offre };
    this.showModal = true;
  }

  onSubmit() {
    if (this.isEditing) {
      const idx = this.offres.findIndex(o => o.id === this.form.id);
      if (idx > -1) this.offres[idx] = { ...this.offres[idx], ...this.form };
    } else {
      this.offres.push({ ...this.form, id: Date.now(), candidatures: 0 });
    }
    this.showModal = false;
  }

  deleteItem(id: number) {
    if (confirm('Supprimer cette offre ?')) {
      this.offres = this.offres.filter(o => o.id !== id);
    }
  }

  getStatutBadge(statut: string): string {
    const map: any = { ouverte: 'bg-green-100 text-green-700', fermee: 'bg-gray-100 text-gray-700', en_cours: 'bg-yellow-100 text-yellow-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }
}
