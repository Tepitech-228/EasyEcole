import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';

@Component({
  selector: 'app-mon-compte-page',
  templateUrl: './mon-compte-page.component.html',
  styleUrls: ['./mon-compte-page.component.scss']
})
export class MonComptePageComponent implements OnInit {

  /** Libellés lisibles des rôles (l'API renvoie la valeur technique de l'enum). */
  private static readonly LIBELLES_ROLES: { [role: string]: string } = {
    apprenant: 'Apprenant',
    institution: 'Institution',
    caissier_banque: 'Caissier banque',
    enseignant: 'Enseignant',
    personnel_administratif: 'Personnel administratif',
    ressources_humaines: 'Ressources humaines',
    cabinet_comptable: 'Cabinet comptable',
    esa_compta: 'ESA Compta',
    comite_orientation: 'Comité d\'orientation',
    admin: 'Administrateur',
    parent: 'Parent',
    secretaire: 'Secrétaire',
    surveillant: 'Surveillant',
    superviseur_general: 'Superviseur général',
  }

  disableButton: boolean = true
  nomPrenomsAlreadyUsed: boolean = false
  identifiantsUpdateError: boolean = false
  identifiantsUpdateSuccess: boolean = false
  passwordWrongError: boolean = false
  passwordUpdateError: boolean = false

  /* États de chargement : chargement initial du profil + soumissions. */
  chargementProfil: boolean = true
  savingIdentifiants: boolean = false
  savingMotDePasse: boolean = false

  /* Affichage/masquage des mots de passe. */
  showOldPassword: boolean = false
  showNewPassword: boolean = false
  showConfirmPassword: boolean = false

  identifiantsForm: FormGroup = new FormGroup({
    email: new FormControl(null),
    identifiant: new FormControl(null),
    nom: new FormControl(null, [Validators.required]),
    prenoms: new FormControl(null, [Validators.required]),
    contact: new FormControl(null, []),
  })

  passwordForm: FormGroup = new FormGroup({
    oldPassword: new FormControl(null, [Validators.required, Validators.minLength(8)]),
    password: new FormControl(null, [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl(null, [Validators.required, Validators.minLength(8),]),
  })

  utilisateur?: Utilisateur

  constructor(private authService: AuthService, private utilisateurService: UtilisateurService) {
    this.getUtilisateur()
  }

  ngOnInit(): void {
  }

  /* ------------------------------------------------------------------ */
  /* Valeurs dérivées pour l'affichage (carte profil)                    */
  /* ------------------------------------------------------------------ */

  get initiales(): string {
    const nom = (this.utilisateur?.nom || '').trim()
    const prenoms = (this.utilisateur?.prenoms || '').trim()
    return `${nom.charAt(0)}${prenoms.charAt(0)}`.toUpperCase()
  }

  get nomComplet(): string {
    const nomComplet = `${this.utilisateur?.nom || ''} ${this.utilisateur?.prenoms || ''}`.trim()
    return nomComplet || 'Utilisateur'
  }

  get libelleRole(): string {
    const role = this.utilisateur?.role
    if (!role) {
      return 'Utilisateur'
    }
    return MonComptePageComponent.LIBELLES_ROLES[role] || role
  }

  /** Vrai si au moins un champ modifiable diffère des valeurs chargées. */
  get identifiantsModifies(): boolean {
    if (!this.utilisateur) {
      return false
    }
    const valeurs = this.identifiantsForm.value
    return (
      valeurs.nom !== this.utilisateur.nom ||
      valeurs.prenoms !== this.utilisateur.prenoms ||
      (valeurs.contact ?? '') !== (this.utilisateur.contact ?? '')
    )
  }

  /** Vrai dès que les deux mots de passe saisis sont différents. */
  get motsDePasseDifferent(): boolean {
    const password = this.passwordForm.get('password')?.value
    const confirmation = this.passwordForm.get('confirmPassword')?.value
    return !!password && !!confirmation && password !== confirmation
  }

  /** Aide au rendu des états d'erreur visuels sur les champs. */
  estInvalide(form: FormGroup, champ: string): boolean {
    const control = form.get(champ)
    return !!control && control.invalid && (control.dirty || control.touched)
  }

  /* ------------------------------------------------------------------ */
  /* Chargement / mise à jour                                            */
  /* ------------------------------------------------------------------ */

  getUtilisateur(): void {
    this.utilisateurService.get().subscribe({
      next: (value) => {
        this.disableButton = false
        this.chargementProfil = false
        this.utilisateur = value
        this.identifiantsForm.get('email')!.setValue(this.utilisateur.email)
        this.identifiantsForm.get('identifiant')!.setValue(this.utilisateur.identifiant)
        this.identifiantsForm.get('nom')!.setValue(this.utilisateur.nom)
        this.identifiantsForm.get('prenoms')!.setValue(this.utilisateur.prenoms)
        this.identifiantsForm.get('contact')!.setValue(this.utilisateur.contact)
        this.identifiantsForm.markAsPristine()
        this.identifiantsForm.markAsUntouched()
      },
      error: (err: HttpErrorResponse) => {
        this.disableButton = false
        this.chargementProfil = false
        console.error(err)
      }
    })
  }

  modifierIdentifiants(): void {
    this.identifiantsForm.markAllAsTouched()
    this.disableButton = true
    this.savingIdentifiants = true

    if (!this.identifiantsForm.valid || !this.identifiantsModifies) {
      this.disableButton = false
      this.savingIdentifiants = false
      return
    }

    let nom: string = this.identifiantsForm.get('nom')!.value
    let prenoms: string = this.identifiantsForm.get('prenoms')!.value
    let contact: string = this.identifiantsForm.get('contact')!.value

    let utilisateur = new Utilisateur()
    utilisateur.nom = nom
    utilisateur.prenoms = prenoms
    utilisateur.contact = contact

    this.utilisateurService.update(utilisateur).subscribe({
      next: () => {
        this.disableButton = false
        this.savingIdentifiants = false
        this.identifiantsUpdateSuccess = true
        setTimeout(() => { this.identifiantsUpdateSuccess = false }, 2000)

        this.getUtilisateur()
      },
      error: (err: HttpErrorResponse) => {
        this.disableButton = false
        this.savingIdentifiants = false
        this.nomPrenomsAlreadyUsed = !!err.error?.nomPrenomsAlreadyUsed
        this.identifiantsUpdateError = true

        setTimeout(() => {
          this.nomPrenomsAlreadyUsed = false
          this.identifiantsUpdateError = false
        }, 3000)
      },
    })
  }

  modifierMotDePasse(): void {
    this.passwordForm.markAllAsTouched()
    this.disableButton = true
    this.savingMotDePasse = true

    if (!this.passwordForm.valid) {
      this.disableButton = false
      this.savingMotDePasse = false
      return
    }

    if (this.passwordForm.get('password')!.value !== this.passwordForm.get('confirmPassword')!.value) {
      this.disableButton = false
      this.savingMotDePasse = false
      return
    }

    let data = {
      oldPassword: this.passwordForm.get('oldPassword')!.value,
      password: this.passwordForm.get('password')!.value
    }

    this.authService.resetPassword(data).subscribe({
      next: () => {
        this.disableButton = false
        this.savingMotDePasse = false
        this.authService.logout()
      },
      error: (err: HttpErrorResponse) => {
        this.disableButton = false
        this.savingMotDePasse = false
        if (err.error?.passwordWrong == true) {
          this.passwordWrongError = true

          setTimeout(() => {
            this.passwordWrongError = false
          }, 3000)
        }
        else {
          this.passwordUpdateError = true

          setTimeout(() => {
            this.passwordUpdateError = false
          }, 3000)
        }
      },
    })
  }
}
