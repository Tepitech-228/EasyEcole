import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { QualiteNonConformiteService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';
import { QuaNonConformite } from 'src/app/data/modules/qualite/models/QuaNonConformite.model';

@Component({
  selector: 'app-non-conformites-page',
  templateUrl: './non-conformites-page.component.html',
  styleUrls: ['./non-conformites-page.component.scss']
})
export class NonConformitesPageComponent extends BaseComponentClass implements OnInit {
  items: QuaNonConformite[] = [];
  filtered: QuaNonConformite[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  search = '';
  filtreStatut = '';
  filtreType = '';
  selected: QuaNonConformite | null = null;

  constructor(private service: QualiteNonConformiteService) { super(); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.items = res; this.filtrer(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  filtrer(): void {
    this.filtered = this.items.filter(i => {
      if (this.filtreStatut && i.statut !== this.filtreStatut) return false;
      if (this.filtreType && i.type !== this.filtreType) return false;
      if (this.search && !i.description?.toLowerCase().includes(this.search.toLowerCase())) return false;
      return true;
    });
  }

  ouvrirFormulaire(item?: QuaNonConformite): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { type: 'mineure', source: '', processus: '', description: '', priorite: 'moyenne', statut: 'ouverte' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; this.selected = null; }

  sauvegarder(): void {
    if (!this.formData.description || !this.formData.source) return;
    const obs = this.editingId
      ? this.service.update(this.editingId, this.formData)
      : this.service.create(this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id?: string): void {
    if (!id || !confirm('Supprimer cette NC ?')) return;
    this.service.delete(id).subscribe({ next: () => this.load() });
  }

  voirDetails(item: QuaNonConformite): void { this.selected = item; }

  getBadgeColor(type?: string): string {
    const map: any = { critique: 'red', majeure: 'orange', mineure: 'yellow' };
    return map[type || ''] || 'gray';
  }

  getStatutColor(statut?: string): string {
    const map: any = { ouverte: 'bg-red-100 text-red-700', en_cours: 'bg-blue-100 text-blue-700', traitee: 'bg-amber-100 text-amber-700', fermee: 'bg-green-100 text-green-700' };
    return map[statut || ''] || 'bg-gray-100 text-gray-700';
  }
}
