import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface Utilisateur {
  id: string
  nom: string
  prenoms: string
  email: string
  identifiant: string
  role: string
  contact: string
  statut: string
  dateCreation: string
}

@Component({
  selector: 'app-utilisateurs-page',
  templateUrl: './utilisateurs-page.component.html',
  styleUrls: ['./utilisateurs-page.component.scss']
})
export class UtilisateursPageComponent extends BaseComponentClass {
  utilisateurs: Utilisateur[] = [
    { id: '1', nom: 'Admin', prenoms: 'Super', email: 'admin@easyecole.com', identifiant: 'admin', role: 'Administrateur', contact: '691234567', statut: 'Actif', dateCreation: '2025-01-15' },
    { id: '2', nom: 'Dupont', prenoms: 'Jean', email: 'jean.dupont@ecole.com', identifiant: 'jdupont', role: 'Enseignant', contact: '692345678', statut: 'Actif', dateCreation: '2025-02-01' },
    { id: '3', nom: 'Kamga', prenoms: 'Marie', email: 'marie.k@ecole.com', identifiant: 'mkamga', role: 'Institution', contact: '693456789', statut: 'Actif', dateCreation: '2025-01-20' },
    { id: '4', nom: 'Tchinda', prenoms: 'Paul', email: 'paul.t@ecole.com', identifiant: 'ptchinda', role: 'Apprenant', contact: '694567890', statut: 'Actif', dateCreation: '2025-09-01' },
    { id: '5', nom: 'Nkwi', prenoms: 'Alice', email: 'alice.n@ecole.com', identifiant: 'ankwi', role: 'Apprenant', contact: '695678901', statut: 'Inactif', dateCreation: '2025-09-01' },
  ]
  loading: boolean = false
  searchTerm: string = ''
  roleFilter: string = ''

  constructor() { super() }

  get filteredUtilisateurs(): Utilisateur[] {
    return this.utilisateurs.filter(u => {
      const matchSearch = !this.searchTerm || 
        u.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.prenoms.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      const matchRole = !this.roleFilter || u.role === this.roleFilter
      return matchSearch && matchRole
    })
  }

  getActionColor(statut: string): string {
    return statut === 'Actif' ? 'green' : 'red'
  }
}
