import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-fournisseurs-page',
  templateUrl: './fournisseurs-page.component.html',
  styleUrls: ['./fournisseurs-page.component.scss']
})
export class FournisseursPageComponent extends BaseComponentClass implements OnInit {
  fournisseurs: any[] = []
  loading = false
  searchTerm = ''
  private readonly API = `${environment.API_URL}/achats/fournisseurs`

  constructor(private http: HttpClient) { super() }

  ngOnInit(): void {
    this.loadFournisseurs()
  }

  loadFournisseurs() {
    this.loading = true
    this.http.get<any[]>(this.API).subscribe({
      next: (data) => {
        this.fournisseurs = data
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  // NOTE BACKEND : le modèle Fournisseur ne possède PAS de colonne `statut`
  // (ni aucune ENUM associée — voir lib/modules/achats/models/Fournisseur.js).
  // Le champ est donc absent des réponses API : l'affichage de la colonne
  // « Statut » retombe sur le fallback neutre. Aucune enum à aligner côté carte.
  getStatutBadge(statut: string): string {
    const map: any = { actif: 'bg-green-100 text-green-700', inactif: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
