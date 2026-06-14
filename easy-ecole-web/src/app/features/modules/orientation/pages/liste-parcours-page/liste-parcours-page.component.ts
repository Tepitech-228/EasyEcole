import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Categorie } from 'src/app/data/modules/orientation/models/Categorie.model';
import { NiveauEtude } from 'src/app/data/modules/orientation/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { CategorieService } from 'src/app/data/modules/orientation/services/categorie.service';
import { NiveauEtudeService } from 'src/app/data/modules/orientation/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/orientation/services/parcours.service';

@Component({
  selector: 'app-liste-parcours-page',
  templateUrl: './liste-parcours-page.component.html',
  styleUrls: ['./liste-parcours-page.component.scss']
})
export class ListeParcoursPageComponent extends BaseComponentClass implements OnInit {

  selectedCategory?: string
  parcours: Parcours[] = []
  _parcours: Parcours[] = []
  categories: Categorie[] = []
  niveauxEtude: NiveauEtude[] = []

  selectedCategorie: string = 'undefined'
  selectedNiveauEtude: string = 'undefined'

  searchParcours?: string

  constructor(
    private niveauEtudeService: NiveauEtudeService,
    private categorieService: CategorieService,
    private parcoursService: ParcoursService
  ) {
    super()    
    this.getNiveauxEtude()
    this.getCategories()
    this.getParcours()
  }

  ngOnInit(): void {
  }

  filtrerParcours(): void {
    if (this.selectedCategorie == 'undefined' && this.selectedNiveauEtude == 'undefined') {
      this._parcours = this.parcours
    }

    if (this.selectedCategorie != 'undefined' && this.selectedNiveauEtude == 'undefined') {
      this._parcours = this.parcours.filter((value: Parcours) => {
        return value.categorieId == this.selectedCategorie
      })
    }

    if (this.selectedCategorie == 'undefined' && this.selectedNiveauEtude != 'undefined') {
      this._parcours = this.parcours.filter((value: Parcours) => {
        return value.niveauEtudeId == this.selectedNiveauEtude
      })
    }

    if (this.selectedCategorie != 'undefined' && this.selectedNiveauEtude != 'undefined') {
      this._parcours = this.parcours.filter((value: Parcours) => {
        return value.categorieId == this.selectedCategorie && value.niveauEtudeId == this.selectedNiveauEtude
      })
    }
  }
  
  rechercherParcours(): void {
    if (this.searchParcours == undefined || this.searchParcours == '') {
      this._parcours = this.parcours
    }
    else {
      this._parcours = this.parcours.filter((value: Parcours) => {
        console.log(value.titre!.toLowerCase().includes(this.searchParcours!.toLowerCase()))
        return value.titre!.toLowerCase().includes(this.searchParcours!.toLowerCase())
      })
    }
  }

  getParcours(): void {
    this.parcoursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this.filtrerParcours()
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getCategories(): void {
    this.categorieService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.categories = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.niveauxEtude = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

}
