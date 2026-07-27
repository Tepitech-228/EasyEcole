import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-appels-offre-page',
  templateUrl: './appels-offre-page.component.html',
  styleUrls: ['./appels-offre-page.component.scss']
})
export class AppelsOffrePageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  planifications: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  private readonly API = `${environment.API_URL}/marche/ao`;
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
    this.formData = item ? { ...item } : { planificationMarcheId: '', reference: '', objet: '', dateLancement: '', dateLimiteDepot: '', critereEvaluation: '', modalitePaiement: '', garantie: '', statut: 'lance' };
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

  lancer(id: string): void {
    this.http.post(`${this.API}/${id}/lancer`, {}).subscribe({ next: () => this.load() });
  }

  attribuer(id: string): void {
    this.http.post(`${this.API}/${id}/attribuer`, {}).subscribe({ next: () => this.load() });
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer cet appel d\'offres ?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe({ next: () => this.load() });
  }

  getStatutColor(s?: string): string {
    const map: any = { lance: 'bg-green-100 text-green-700', depots: 'bg-blue-100 text-blue-700', evaluating: 'bg-amber-100 text-amber-700', attribue: 'bg-emerald-100 text-emerald-700', infructueux: 'bg-orange-100 text-orange-700', annule: 'bg-red-100 text-red-700' };
    return map[s || ''] || 'bg-gray-100 text-gray-600';
  }

  getStatutLabel(s?: string): string {
    const map: any = { lance: 'Lancé', depots: 'Dépôts', evaluating: 'Évaluation', attribue: 'Attribué', infructueux: 'Infructueux', annule: 'Annulé' };
    return map[s || ''] || s || '';
  }

  getPlanifLabel(id: string): string {
    const p = this.planifications.find(x => x.id === id);
    return p ? p.libelle : id;
  }
}
