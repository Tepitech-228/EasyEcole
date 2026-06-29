import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface Frais {
  id: string
  nom: string
  montant: number
  periodicite: string
  description: string
  actif: boolean
}

@Component({
  selector: 'app-frais-page',
  templateUrl: './frais-page.component.html',
  styleUrls: ['./frais-page.component.scss']
})
export class FraisPageComponent extends BaseComponentClass {
  fraisList: Frais[] = [
    { id: '1', nom: 'Frais de scolarité', montant: 500000, periodicite: 'Annuel', description: 'Frais de scolarité annuels', actif: true },
    { id: '2', nom: 'Frais d\'inscription', montant: 25000, periodicite: 'Unique', description: 'Frais d\'inscription à la rentrée', actif: true },
    { id: '3', nom: 'Frais de dossier', montant: 10000, periodicite: 'Unique', description: 'Frais d\'étude de dossier', actif: true },
    { id: '4', nom: 'Assurance scolaire', montant: 15000, periodicite: 'Annuel', description: 'Assurance scolaire obligatoire', actif: false },
  ]
  loading: boolean = false

  constructor() { super() }
}
