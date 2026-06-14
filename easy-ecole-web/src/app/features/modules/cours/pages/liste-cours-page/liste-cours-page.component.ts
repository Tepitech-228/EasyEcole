import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { Router } from '@angular/router';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';

@Component({
  selector: 'app-liste-cours-page',
  templateUrl: './liste-cours-page.component.html',
  styleUrls: ['./liste-cours-page.component.scss']
})
export class ListeCoursPageComponent extends BaseComponentClass implements OnInit {

  cursusApprenant?: CursusApprenant
  cours: Cours[] = []
  _cours: Cours[] = []
  niveauxEtude: NiveauEtude[] = []
  _niveauxEtude: NiveauEtude[] = []
  classes: Classe[] = []
  _classes: Classe[] = []
  parcours: Parcours[] = []
  _parcours: Parcours[] = []

  selectedNiveauEtude: string = 'undefined'
  selectedClasse: string = 'undefined'
  selectedParcours: string = 'undefined'

  searchCours?: string

  constructor(
    private niveauEtudeService: NiveauEtudeService,
    private coursService: CoursService,
    private classeService: ClasseService,
    private cursusApprenantService: CursusApprenantService,
    private parcoursService: ParcoursService,
  ) {
    super()
    this.getNiveauxEtude()
    this.getClasses()
    this.getParcours()

    if (this.rolesValue.isApprenant) {
      this.getCoursChoisis()
    }
    else {
      this.getCours()
    }
  }

  ngOnInit(): void {
  }

  filtrerCours(): void {
    // console.log(this.selectedNiveauEtude, this.selectedClasse, this.selectedParcours)

    this._niveauxEtude = this.niveauxEtude.filter((value: NiveauEtude) => {
      return this.selectedNiveauEtude == 'undefined' || value.id == this.selectedNiveauEtude
    })
    this._classes = this.classes.filter((value: Classe) => {
      return this.selectedNiveauEtude == 'undefined' || value.niveauEtudeId == this.selectedNiveauEtude
    })
    this._parcours = this.parcours.filter((value: Parcours) => {
      return this.selectedNiveauEtude == 'undefined' || value.niveauEtudeId == this.selectedNiveauEtude
    })

    this._cours = this.cours.filter((value: Cours) => {
      return (this.selectedNiveauEtude == 'undefined' || value.parcours?.niveauEtudeId == this.selectedNiveauEtude) &&
        (this.selectedClasse == 'undefined' || value.classeId == this.selectedClasse) &&
        (this.selectedParcours == 'undefined' || value.parcoursId == this.selectedParcours)
    })
  }

  supprimerFiltres(): void {
    this.searchCours = undefined
    
    this.selectedNiveauEtude = 'undefined'
    this.selectedClasse = 'undefined'
    this.selectedParcours = 'undefined'
    this.filtrerCours()
  }

  rechercherCours(): void {
    if (this.searchCours == undefined || this.searchCours == '') {
      this._cours = this.cours
    }
    else {
      this._cours = this.cours.filter((value: Cours) => {
        console.log(value.intitule!.toLowerCase().includes(this.searchCours!.toLowerCase()))
        return value.intitule!.toLowerCase().includes(this.searchCours!.toLowerCase())
      })
    }
  }

  getCoursChoisis(): void {
    this.cursusApprenantService.getCoursChoisis()
      .subscribe(
        {
          next: (res) => {
            this.cursusApprenant = res

            if (this.cursusApprenant != null) {
              this.cours = this.cursusApprenant.demandeInscription?.cours ?? []
              this.filtrerCours()
            }
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getCours(): void {
    this.coursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.cours = res
            this.filtrerCours()
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
            this._niveauxEtude = this.niveauxEtude
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getClasses(): void {
    this.classeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.classes = res
            this._classes = this.classes
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getParcours(): void {
    this.parcoursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this._parcours = this.parcours
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }
}