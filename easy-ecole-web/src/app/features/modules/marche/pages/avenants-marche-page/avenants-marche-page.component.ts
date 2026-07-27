import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-avenants-marche-page',
  templateUrl: './avenants-marche-page.component.html',
  styleUrls: ['./avenants-marche-page.component.scss']
})
export class AvenantsMarchePageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  contrats: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  private readonly API = `${environment.API_URL}/marche/avenants`;
  private readonly API_CONTRATS = `${environment.API_URL}/marche/contrats`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.http.get<any[]>(this.API_CONTRATS).subscribe({ next: (r) => this.contrats = r });
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
    this.formData = item ? { ...item } : { contratMarcheId: '', reference: '', objet: '', dateSignature: '', montantAvenant: 0, dureeAvenant: 0, statut: 'valide' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.reference || !this.formData.objet || !this.formData.contratMarcheId) return;
    const obs = this.editingId
      ? this.http.put(`${this.API}/${this.editingId}`, this.formData)
      : this.http.post(this.API, this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer cet avenant ?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe({ next: () => this.load() });
  }

  getStatutColor(s?: string): string {
    const map: any = { valide: 'bg-green-100 text-green-700', applique: 'bg-blue-100 text-blue-700' };
    return map[s || ''] || 'bg-gray-100 text-gray-600';
  }

  getContratRef(id: string): string {
    const c = this.contrats.find(x => x.id === id);
    return c ? c.reference : id;
  }
}
