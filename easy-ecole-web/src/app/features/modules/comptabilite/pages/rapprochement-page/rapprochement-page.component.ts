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
  private readonly API_RAPPROCHEMENT = `${environment.API_URL}/comptabilite/rapprochement`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.API_URL}/comptabilite/comptes-bancaires`).subscribe({
      next: (res) => this.comptes = res
    });
  }

  /**
   * Source de données : GET /comptabilite/rapprochement/non-rapprochees
   * Renvoie { success, ecritures, lignesReleve } déjà pré-filtrées (écritures
   * non lettrées du compte 512 et lignes de relevé non rapprochées).
   */
  chargerDonnees(): void {
    if (!this.compteBancaireId) return;
    this.loading = true;
    const url = `${this.API_RAPPROCHEMENT}/non-rapprochees?compteBancaireId=${this.compteBancaireId}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.ecritures = (res && res.ecritures) || [];
        this.lignesReleve = (res && res.lignesReleve) || [];
        this.loading = false;
      },
      error: () => { this.ecritures = []; this.lignesReleve = []; this.loading = false; }
    });
  }

  get ecrituresNonLettrees(): any[] {
    // Les écritures provenant de /non-rapprochees sont toutes non identifiées par une lettre
    return this.ecritures.filter(e => !e.lettre);
  }

  get lignesNonLettrees(): any[] {
    // Les lignes provenant de /non-rapprochees sont marquées rapprochee: false
    return this.lignesReleve.filter(l => !l.rapprochee);
  }

  get ecrituresLettrees(): any[] {
    return this.ecritures.filter(e => e.lettre);
  }

  get lignesLettrees(): any[] {
    return this.lignesReleve.filter(l => l.rapprochee);
  }

  ouvrirLettrage(ecritureId?: string, ligneId?: string): void {
    this.lettreData = { ecritureId: ecritureId || '', ligneReleveId: ligneId || '' };
    this.showLettreForm = true;
  }

  /**
   * Rapproche une écriture avec une ligne de relevé.
   * POST /comptabilite/rapprochement/rapprocher  body { ecritureComptableId, ligneReleveId }
   */
  lettrer(): void {
    if (!this.lettreData.ecritureId || !this.lettreData.ligneReleveId) return;
    const payload = {
      ecritureComptableId: this.lettreData.ecritureId,
      ligneReleveId: this.lettreData.ligneReleveId
    };
    this.http.post(`${this.API_RAPPROCHEMENT}/rapprocher`, payload).subscribe({
      next: () => {
        this.showLettreForm = false;
        this.chargerDonnees();
      }
    });
  }

  /**
   * Défaire un rapprochement.
   * POST /comptabilite/rapprochement/defaire/:ligneReleveId  (id du rapprochement = id de la ligne)
   */
  deletrer(ligneReleveId: string): void {
    if (!ligneReleveId) return;
    this.http.post(`${this.API_RAPPROCHEMENT}/defaire/${ligneReleveId}`, {}).subscribe({
      next: () => this.chargerDonnees()
    });
  }

  getStatutLettrage(item: any): string {
    return item.lettre ? `Lettre ${item.lettre}` : 'Non lettré';
  }
}
