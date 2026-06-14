import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-liste-enseignants-page',
  templateUrl: './liste-enseignants-page.component.html',
  styleUrls: ['./liste-enseignants-page.component.scss']
})
export class ListeEnseignantsPageComponent extends BaseComponentClass implements OnInit {

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS_ENSEIGNANTS
  showNouvelEnseignantModal: boolean = false

  enseignants: Enseignant[] = []

  enseignantForm: FormGroup = new FormGroup({
    identifiant: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    nom: new FormControl(null, [Validators.required]),
    prenoms: new FormControl(null, [Validators.required]),
    contact: new FormControl(null, [Validators.required]),
  })

  constructor(
    private router: Router,
    private authService: AuthService,
    private enseignantService: EnseignantService) {
    super()
    if (!this.rolesValue.isInstitution) {
      this.router.navigate(['/'])
    }
    else {
      this.getEnseignants()
    }
  }

  ngOnInit(): void {
  }

  private getEnseignants(): void {
    this.enseignantService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.enseignants = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  ajouterEnseignant(): void {
    this.enseignantForm.markAllAsTouched()
    if (this.enseignantForm.valid) {
      let enseignant: Enseignant = new Enseignant()
      enseignant.utilisateur = new Utilisateur()
      enseignant.utilisateur.identifiant = this.enseignantForm.get('identifiant')!.value
      enseignant.utilisateur.email = this.enseignantForm.get('email')!.value
      enseignant.utilisateur.nom = this.enseignantForm.get('nom')!.value ?? new Date()
      enseignant.utilisateur.prenoms = this.enseignantForm.get('prenoms')!.value
      enseignant.utilisateur.contact = this.enseignantForm.get('contact')!.value

      this.authService.registerEnseignant(enseignant).subscribe({
        next: (res) => {
          this.getEnseignants()
          this.closeNouvelEnseignantModal()
        },
        error: (err) => {

        },
      })
    }
  }

  // Modals
  openNouvelEnseignantModal(): void {
    this.showNouvelEnseignantModal = true
  }
  closeNouvelEnseignantModal(): void {
    this.showNouvelEnseignantModal = false
    this.enseignantForm.reset()
  }

}
