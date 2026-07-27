import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-comptes-bancaires-page',
  templateUrl: './comptes-bancaires-page.component.html',
  styleUrls: ['./comptes-bancaires-page.component.scss']
})
export class ComptesBancairesPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  private readonly API = `${environment.API_URL}/comptabilite/comptes-bancaires`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.API).subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  ouvrirFormulaire(item?: any): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { libelle: '', iban: '', banque: '', soldeOuverture: 0, devise: 'XOF' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.libelle) return;
    const obs = this.editingId
      ? this.http.put(`${this.API}/${this.editingId}`, this.formData)
      : this.http.post(this.API, this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id: string): void {
    if (!confirm('Supprimer ce compte ?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe({ next: () => this.load() });
  }
}
