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

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  showNouvelEnseignantModal: boolean = false

  enseignants: Enseignant[] = []

  enseignantForm: FormGroup = new FormGroup({
    identifiant: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    nom: new FormControl(null, [Validators.required]),
    prenoms: new FormControl(null, [Validators.required]),
    contact: new FormControl(null, [Validators.required]),
    cni: new FormControl(null),
    matricule: new FormControl(null),
    sexe: new FormControl(null),
    dateNaissance: new FormControl(null),
    nationalite: new FormControl(null),
    plusHautDiplome: new FormControl(null),
    gradeAcademique: new FormControl(null),
    statut: new FormControl(null),
    specialite: new FormControl(null),
    heureTheoriqueAnnuelle: new FormControl(null),
    heureReelleAnnuelle: new FormControl(null),
    fonctionAdministrative: new FormControl(null),
    statutHandicap: new FormControl(null),
    natureHandicap: new FormControl(null),
    anneeExperience: new FormControl(null),
    nifOtr: new FormControl(null),
  })

  constructor(
    private router: Router,
    private authService: AuthService,
    private enseignantService: EnseignantService) {
    super()
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
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

      enseignant.cni = this.enseignantForm.get('cni')!.value ?? null
      enseignant.matricule = this.enseignantForm.get('matricule')!.value ?? null
      enseignant.sexe = this.enseignantForm.get('sexe')!.value ?? null
      enseignant.dateNaissance = this.enseignantForm.get('dateNaissance')!.value ?? null
      enseignant.nationalite = this.enseignantForm.get('nationalite')!.value ?? null
      enseignant.plusHautDiplome = this.enseignantForm.get('plusHautDiplome')!.value ?? null
      enseignant.gradeAcademique = this.enseignantForm.get('gradeAcademique')!.value ?? null
      enseignant.statut = this.enseignantForm.get('statut')!.value ?? null
      enseignant.specialite = this.enseignantForm.get('specialite')!.value ?? null
      enseignant.heureTheoriqueAnnuelle = this.enseignantForm.get('heureTheoriqueAnnuelle')!.value !== '' && this.enseignantForm.get('heureTheoriqueAnnuelle')!.value != null ? Number(this.enseignantForm.get('heureTheoriqueAnnuelle')!.value) : undefined
      enseignant.heureReelleAnnuelle = this.enseignantForm.get('heureReelleAnnuelle')!.value !== '' && this.enseignantForm.get('heureReelleAnnuelle')!.value != null ? Number(this.enseignantForm.get('heureReelleAnnuelle')!.value) : undefined
      enseignant.fonctionAdministrative = this.enseignantForm.get('fonctionAdministrative')!.value ?? null
      enseignant.statutHandicap = this.enseignantForm.get('statutHandicap')!.value === true || this.enseignantForm.get('statutHandicap')!.value === 'true' ? true : false
      enseignant.natureHandicap = this.enseignantForm.get('natureHandicap')!.value ?? null
      enseignant.anneeExperience = this.enseignantForm.get('anneeExperience')!.value !== '' && this.enseignantForm.get('anneeExperience')!.value != null ? Number(this.enseignantForm.get('anneeExperience')!.value) : undefined
      enseignant.nifOtr = this.enseignantForm.get('nifOtr')!.value ?? null

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
