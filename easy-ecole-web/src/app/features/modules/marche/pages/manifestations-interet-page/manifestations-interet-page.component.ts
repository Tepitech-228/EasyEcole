import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-manifestations-interet-page',
  templateUrl: './manifestations-interet-page.component.html',
  styleUrls: ['./manifestations-interet-page.component.scss']
})
export class ManifestationsInteretPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  planifications: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  private readonly API = `${environment.API_URL}/marche/ami`;
  private readonly API_PLANIF = `${environment.API_URL}/marche/planifications`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.http.get<any[]>(this.API_PLANIF).subscribe({ next: (r) => this.planifications = r });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.API).subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  ouvrirFormulaire(item?: any): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { planificationMarcheId: '', reference: '', objet: '', dateDepot: '', dateOuverture: '', soumissionnaire: '', montantEstime: 0, statut: 'deposee' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.reference || !this.formData.objet) return;
    const obs = this.editingId
      ? this.http.put(`${this.API}/${this.editingId}`, this.formData)
      : this.http.post(this.API, this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  soumettre(id: string): void {
    this.http.post(`${this.API}/${id}/soumettre`, {}).subscribe({ next: () => this.load() });
  }

  retenir(id: string): void {
    this.http.post(`${this.API}/${id}/retenir`, {}).subscribe({ next: () => this.load() });
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer cette manifestation ?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe({ next: () => this.load() });
  }

  getStatutColor(s?: string): string {
    const map: any = { deposee: 'bg-blue-100 text-blue-700', examinee: 'bg-amber-100 text-amber-700', rejetee: 'bg-red-100 text-red-700', retenue: 'bg-green-100 text-green-700' };
    return map[s || ''] || 'bg-gray-100 text-gray-600';
  }

  getPlanifLabel(id: string): string {
    const p = this.planifications.find(x => x.id === id);
    return p ? p.libelle : id;
  }
}
