import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-liste-commandes-page',
  templateUrl: './liste-commandes-page.component.html',
  styleUrls: ['./liste-commandes-page.component.scss']
})
export class ListeCommandesPageComponent extends BaseComponentClass implements OnInit {
  commandes: any[] = []
  loading = false
  searchTerm = ''
  private readonly API = `${environment.API_URL}/achats/commandes`

  constructor(private http: HttpClient) { super() }

  ngOnInit(): void {
    this.loadCommandes()
  }

  loadCommandes() {
    this.loading = true
    this.http.get<any[]>(this.API).subscribe({
      next: (data) => {
        this.commandes = data
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  get totalMontant(): number {
    return this.commandes.reduce((s, c) => s + (c.montantTotal || c.montant || 0), 0)
  }

  // ENUM backend Commande : 'en_cours' | 'livree' | 'annulee' (défaut 'en_cours')
  get envoyeesCount(): number {
    return this.commandes.filter(c => c.statut === 'en_cours').length
  }

  getStatutBadge(statut: string): string {
    const map: any = { en_cours: 'bg-blue-100 text-blue-700', livree: 'bg-green-100 text-green-700', annulee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
