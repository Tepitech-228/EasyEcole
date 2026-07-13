import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';

@Component({
  selector: 'app-liste-parcours-page',
  templateUrl: './liste-parcours-page.component.html',
  styleUrls: ['./liste-parcours-page.component.scss']
})
export class ListeParcoursPageComponent extends BaseComponentClass implements OnInit {

  showEditerParcoursModal: boolean = false
  showSupprimerParcoursModal: boolean = false

  selectedCategory?: string
  parcours: Parcours[] = []
  _parcours: Parcours[] = []
  niveauxEtude: NiveauEtude[] = []

  selectedNiveauEtude: string = 'undefined'

  searchParcours?: string

  parcoursForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    niveauEtude: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor(
    private router: Router,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,) {
    super()
    // if (!this.rolesValue.isInstitution) {
    //   this.router.navigate(['/'])
    // }
    // else {
      this.getNiveauxEtude()
      this.getParcours()
    // }
  }

  ngOnInit(): void {
  }

  private getNiveauxEtude(): void {
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

  private getParcours(): void {
    this.parcoursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this.filtrerParcours()
            console.log(res)
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }
  
  filtrerParcours(): void {
    if (this.selectedNiveauEtude == 'undefined') {
      this._parcours = this.parcours
    }

    if (this.selectedNiveauEtude != 'undefined') {
      this._parcours = this.parcours.filter((value: Parcours) => {
        return value.niveauEtudeId == this.selectedNiveauEtude
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

  ajouterParcours(): void {
    this.parcoursForm.markAllAsTouched()
  }

}
