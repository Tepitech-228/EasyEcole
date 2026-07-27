import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-fournisseurs-page',
  templateUrl: './fournisseurs-page.component.html',
  styleUrls: ['./fournisseurs-page.component.scss']
})
export class FournisseursPageComponent extends BaseComponentClass implements OnInit {
  fournisseurs: any[] = []
  loading = false
  searchTerm = ''

  constructor() { super() }

  ngOnInit(): void {
    this.loadFournisseurs()
  }

  loadFournisseurs() {
    this.loading = true
    setTimeout(() => {
      this.fournisseurs = [
        { id: 1, nom: 'Tech Solutions', email: 'contact@techsolutions.cg', telephone: '+242 06 000 00 00', ville: 'Brazzaville', statut: 'actif' },
        { id: 2, nom: 'Bureau Express', email: 'contact@bureauexpress.cg', telephone: '+242 06 111 11 11', ville: 'Pointe-Noire', statut: 'actif' },
      ]
      this.loading = false
    }, 500)
  }

  getStatutBadge(statut: string): string {
    const map: any = { actif: 'bg-green-100 text-green-700', inactif: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }
}
