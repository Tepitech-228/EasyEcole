import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';

@Component({
  selector: 'app-liste-cours-page',
  templateUrl: './liste-cours-page.component.html',
  styleUrls: ['./liste-cours-page.component.scss']
})
export class ListeCoursPageComponent extends BaseComponentClass implements OnInit {

  showNouveaucoursModal: boolean = false
  showEditerCoursModal: boolean = false
  showSupprimerCoursModal: boolean = false

  selectedCours?: Cours
  cours: Cours[] = []
  parcours: Parcours[] = []

  coursForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    parcours: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor(
    private router: Router,) {
    super()
    if (!this.rolesValue.isApprenant) {
      this.router.navigate(['/'])
    }
    else {
      this.getParcours()
      this.getCours()
    }
  }

  ngOnInit(): void {
  }

  private getParcours(): void {
  }

  private getCours(): void {
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
    this.cours.push(new Cours())
  }

  ajouterCours(): void {
    this.coursForm.markAllAsTouched()
  }

  // Modals
  openEditerCoursModal(cours): void {
    this.selectedCours = cours
    this.showEditerCoursModal = true
  }

  openSupprimerCoursModal(cours): void {
    this.selectedCours = cours
    this.showSupprimerCoursModal = true
  }

  closeNouveaucoursModal(): void {
    this.showNouveaucoursModal = false
  }
}
