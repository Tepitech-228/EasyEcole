import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-demandes-conge-page',
  templateUrl: './demandes-conge-page.component.html',
  styleUrls: ['./demandes-conge-page.component.scss']
})
export class DemandesCongePageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  filtreStatut = '';
  private readonly API = `${environment.API_URL}/rh/demandes-conge`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.API).subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get filtered(): any[] {
    return this.filtreStatut ? this.items.filter(i => i.statut === this.filtreStatut) : this.items;
  }

  ouvrirFormulaire(item?: any): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { typeConge: 'annuel', dateDebut: '', dateFin: '', motif: '' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.dateDebut || !this.formData.dateFin) return;
    const obs = this.editingId
      ? this.http.put(`${this.API}/${this.editingId}`, this.formData)
      : this.http.post(this.API, this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  valider(id: string, niveau?: string): void {
    this.http.post(`${this.API}/${id}/valider`, { validationNiveau: niveau || 'validee_rh' }).subscribe({ next: () => this.load() });
  }

  refuser(id: string): void {
    this.http.post(`${this.API}/${id}/refuser`, {}).subscribe({ next: () => this.load() });
  }

  getStatutColor(statut?: string): string {
    const map: any = { soumise: 'bg-blue-100 text-blue-700', validee_rh: 'bg-green-100 text-green-700', validee_superieur: 'bg-emerald-100 text-emerald-700', refusee: 'bg-red-100 text-red-700', annulee: 'bg-gray-100 text-gray-500' };
    return map[statut || ''] || 'bg-gray-100 text-gray-600';
  }

  getTypeConge(type?: string): string {
    const map: any = { annuel: 'Annuel', maladie: 'Maladie', maternite: 'Maternité', exceptionnel: 'Exceptionnel', sans_solde: 'Sans solde' };
    return map[type || ''] || type || '';
  }
}
