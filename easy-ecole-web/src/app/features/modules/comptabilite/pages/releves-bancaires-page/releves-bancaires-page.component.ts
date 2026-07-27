import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-releves-bancaires-page',
  templateUrl: './releves-bancaires-page.component.html',
  styleUrls: ['./releves-bancaires-page.component.scss']
})
export class RelevesBancairesPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  comptes: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  selectedReleve: any = null;
  selectedReleveId: string | null = null;
  private readonly API = `${environment.API_URL}/comptabilite/releves-bancaires`;
  private readonly API_COMPTES = `${environment.API_URL}/comptabilite/comptes-bancaires`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.http.get<any[]>(this.API_COMPTES).subscribe({ next: (res) => this.comptes = res });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.API).subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  getCompteLabel(id: string): string {
    const c = this.comptes.find(x => x.id === id);
    return c ? `${c.libelle} (${c.banque})` : id;
  }

  ouvrirFormulaire(item?: any): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { compteBancaireId: '', dateReleve: '', soldeInitial: 0, soldeFinal: 0 };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.compteBancaireId || !this.formData.dateReleve) return;
    const obs = this.editingId
      ? this.http.put(`${this.API}/${this.editingId}`, this.formData)
      : this.http.post(this.API, this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer ce relevé ?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe({ next: () => { this.load(); this.selectedReleveId = null; this.selectedReleve = null; } });
  }

  voirLignes(item: any): void {
    this.selectedReleve = item;
    this.selectedReleveId = item.id;
  }

  fermerLignes(): void { this.selectedReleve = null; this.selectedReleveId = null; }
}
