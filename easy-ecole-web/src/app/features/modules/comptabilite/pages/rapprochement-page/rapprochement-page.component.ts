import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-rapprochement-page',
  templateUrl: './rapprochement-page.component.html',
  styleUrls: ['./rapprochement-page.component.scss']
})
export class RapprochementPageComponent extends BaseComponentClass implements OnInit {
  comptes: any[] = [];
  compteBancaireId = '';
  ecritures: any[] = [];
  lignesReleve: any[] = [];
  loading = false;
  releveSelectionneId = '';
  showLettreForm = false;
  lettreData = { ecritureId: '', ligneReleveId: '' };
  private readonly API_ECRITURES = `${environment.API_URL}/comptabilite/ecritures`;
  private readonly API_RELEVES = `${environment.API_URL}/comptabilite/releves-bancaires`;
  private readonly API_RAPPROCHEMENT = `${environment.API_URL}/comptabilite/rapprochement`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.API_URL}/comptabilite/comptes-bancaires`).subscribe({
      next: (res) => this.comptes = res
    });
  }

  chargerDonnees(): void {
    if (!this.compteBancaireId) return;
    this.loading = true;
    this.http.get<any[]>(`${this.API_ECRITURES}?compteBancaireId=${this.compteBancaireId}`).subscribe({
      next: (res) => { this.ecritures = res; this.chargeLignesReleve(); },
      error: () => this.loading = false
    });
  }

  chargeLignesReleve(): void {
    this.http.get<any[]>(`${this.API_RELEVES}?compteBancaireId=${this.compteBancaireId}&_embed=lignes`).subscribe({
      next: (res) => {
        this.lignesReleve = [].concat(...res.map((r: any) => (r.lignes || []).map((l: any) => ({ ...l, _releveDate: r.dateReleve }))));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get ecrituresNonLettrees(): any[] {
    return this.ecritures.filter(e => !e.lettre);
  }

  get lignesNonLettrees(): any[] {
    return this.lignesReleve.filter(l => !l.lettre);
  }

  get ecrituresLettrees(): any[] {
    return this.ecritures.filter(e => e.lettre);
  }

  get lignesLettrees(): any[] {
    return this.lignesReleve.filter(l => l.lettre);
  }

  ouvrirLettrage(ecritureId?: string, ligneId?: string): void {
    this.lettreData = { ecritureId: ecritureId || '', ligneReleveId: ligneId || '' };
    this.showLettreForm = true;
  }

  lettrer(): void {
    if (!this.lettreData.ecritureId || !this.lettreData.ligneReleveId) return;
    this.http.post(this.API_RAPPROCHEMENT, this.lettreData).subscribe({
      next: () => {
        this.showLettreForm = false;
        this.chargerDonnees();
      }
    });
  }

  deletrer(ecritureId: string): void {
    this.http.delete(`${this.API_RAPPROCHEMENT}/${ecritureId}`).subscribe({
      next: () => this.chargerDonnees()
    });
  }

  getStatutLettrage(item: any): string {
    return item.lettre ? `Lettre ${item.lettre}` : 'Non lettré';
  }
}
