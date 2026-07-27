import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-contrats-marche-page',
  templateUrl: './contrats-marche-page.component.html',
  styleUrls: ['./contrats-marche-page.component.scss']
})
export class ContratsMarchePageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  appelsOffre: any[] = [];
  manifestations: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  private readonly API = `${environment.API_URL}/marche/contrats`;
  private readonly API_AO = `${environment.API_URL}/marche/ao`;
  private readonly API_AMI = `${environment.API_URL}/marche/ami`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.http.get<any[]>(this.API_AO).subscribe({ next: (r) => this.appelsOffre = r });
    this.http.get<any[]>(this.API_AMI).subscribe({ next: (r) => this.manifestations = r });
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
    this.formData = item ? { ...item } : { appelOffreId: '', manifestationInteretId: '', reference: '', objet: '', dateSignature: '', dateDebut: '', dateFin: '', montantContractuel: 0, conditionsParticulieres: '', statut: 'signe' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.reference || !this.formData.objet || !this.formData.dateDebut || !this.formData.dateFin) return;
    const obs = this.editingId
      ? this.http.put(`${this.API}/${this.editingId}`, this.formData)
      : this.http.post(this.API, this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  signer(id: string): void {
    this.http.post(`${this.API}/${id}/signer`, {}).subscribe({ next: () => this.load() });
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer ce contrat ?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe({ next: () => this.load() });
  }

  getStatutColor(s?: string): string {
    const map: any = { signe: 'bg-blue-100 text-blue-700', encours: 'bg-green-100 text-green-700', termine: 'bg-gray-100 text-gray-700', resile: 'bg-red-100 text-red-700' };
    return map[s || ''] || 'bg-gray-100 text-gray-600';
  }

  getStatutLabel(s?: string): string {
    const map: any = { signe: 'Signé', encours: 'En cours', termine: 'Terminé', resile: 'Résilié' };
    return map[s || ''] || s || '';
  }

  getAOLabel(id: string): string {
    const a = this.appelsOffre.find(x => x.id === id);
    return a ? a.reference : id;
  }
  getAMILabel(id: string): string {
    const a = this.manifestations.find(x => x.id === id);
    return a ? a.reference : id;
  }
}
