import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface RoleInfo {
  id: string
  nom: string
  code: string
  description: string
  nbUtilisateurs: number
}

@Component({
  selector: 'app-roles-page',
  templateUrl: './roles-page.component.html',
  styleUrls: ['./roles-page.component.scss']
})
export class RolesPageComponent extends BaseComponentClass {
  roles: RoleInfo[] = [
    { id: '1', nom: 'Administrateur', code: 'ADMIN', description: 'Accès complet à tous les modules et paramètres', nbUtilisateurs: 3 },
    { id: '2', nom: 'Institution', code: 'INSTITUTION', description: 'Gestion de l\'établissement et des paramètres', nbUtilisateurs: 5 },
    { id: '3', nom: 'Enseignant', code: 'ENSEIGNANT', description: 'Gestion des cours, notes et présences', nbUtilisateurs: 45 },
    { id: '4', nom: 'Apprenant', code: 'APPRENANT', description: 'Accès aux cours, notes et bulletins', nbUtilisateurs: 1200 },
    { id: '5', nom: 'Caissier', code: 'CAISSIER_BANQUE', description: 'Gestion des paiements et finances', nbUtilisateurs: 4 },
    { id: '6', nom: 'Ressources Humaines', code: 'RESSOURCES_HUMAINES', description: 'Gestion du personnel', nbUtilisateurs: 2 },
    { id: '7', nom: 'Cabinet Comptable', code: 'CABINET_COMPTABLE', description: 'Accès aux rapports financiers', nbUtilisateurs: 1 },
  ]

  constructor() { super() }
}
