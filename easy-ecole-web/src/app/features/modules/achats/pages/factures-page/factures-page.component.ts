import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-factures-page',
  templateUrl: './factures-page.component.html',
  styleUrls: ['./factures-page.component.scss']
})
export class FacturesPageComponent extends BaseComponentClass implements OnInit {
  factures: any[] = []
  loading = false
  searchTerm = ''
  private readonly API = `${environment.API_URL}/achats/factures`

  constructor(private http: HttpClient) { super() }

  ngOnInit(): void {
    this.loadFactures()
  }

  loadFactures() {
    this.loading = true
    this.http.get<any[]>(this.API).subscribe({
      next: (data) => {
        this.factures = data
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  get totalMontant(): number {
    return this.factures.reduce((s, f) => s + (f.montantTotal || f.montant || 0), 0)
  }

  // ENUM backend FactureProforma : 'emise' | 'payee' | 'annulee' (défaut 'emise')
  get enAttenteCount(): number {
    return this.factures.filter(f => f.statut === 'emise').length
  }

  getStatutBadge(statut: string): string {
    const map: any = { emise: 'bg-yellow-100 text-yellow-700', payee: 'bg-green-100 text-green-700', annulee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
