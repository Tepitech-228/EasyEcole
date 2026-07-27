import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-planifications-marche-page',
  templateUrl: './planifications-marche-page.component.html',
  styleUrls: ['./planifications-marche-page.component.scss']
})
export class PlanificationsMarchePageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  private readonly API = `${environment.API_URL}/marche/planifications`;

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
    return this.items;
  }

  ouvrirFormulaire(item?: any): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { libelle: '', dateDebut: '', dateFin: '', description: '', statut: 'planifie' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.libelle || !this.formData.dateDebut || !this.formData.dateFin) return;
    const obs = this.editingId
      ? this.http.put(`${this.API}/${this.editingId}`, this.formData)
      : this.http.post(this.API, this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer cette planification ?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe({ next: () => this.load() });
  }

  getStatutColor(s?: string): string {
    const map: any = { planifie: 'bg-blue-100 text-blue-700', en_cours: 'bg-amber-100 text-amber-700', termine: 'bg-green-100 text-green-700', annule: 'bg-red-100 text-red-700' };
    return map[s || ''] || 'bg-gray-100 text-gray-600';
  }

  getStatutLabel(s?: string): string {
    const map: any = { planifie: 'Planifié', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé' };
    return map[s || ''] || s || '';
  }
}
