import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { FraisInscription } from 'src/app/data/modules/inscription/models/FraisInscription.model';
import { FraisInscriptionService } from 'src/app/data/modules/inscription/services/frais-inscription.service';

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
export class FraisPageComponent extends BaseComponentClass implements OnInit {
  fraisList: Frais[] = []
  loading: boolean = false

  constructor(private fraisInscriptionService: FraisInscriptionService) { super() }

  ngOnInit(): void {
    this.chargerFrais()
  }

  chargerFrais(): void {
    this.loading = true
    this.fraisInscriptionService.getAll().subscribe({
      next: (frais: FraisInscription[]) => {
        // Le modèle API (FraisInscription) n'expose pas periodicite/actif :
        // on mappe les colonnes absentes avec des valeurs neutres.
        this.fraisList = frais.map(f => ({
          id: f.id ?? '',
          nom: f.titre ?? '',
          montant: Number(f.montant) || 0,
          periodicite: '',
          description: f.description ?? '',
          actif: !!f.fraisDesCours,
        }))
        this.loading = false
      },
      error: () => {
        this.fraisList = []
        this.loading = false
      }
    })
  }
}
