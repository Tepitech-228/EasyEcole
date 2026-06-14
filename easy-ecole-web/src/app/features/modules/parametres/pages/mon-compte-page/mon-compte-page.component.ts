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

  disableButton: boolean = true
  nomPrenomsAlreadyUsed: boolean = false
  identifiantsUpdateError: boolean = false
  identifiantsUpdateSuccess: boolean = false
  passwordWrongError: boolean = false
  passwordUpdateError: boolean = false

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

  getUtilisateur(): void {
    this.utilisateurService.get().subscribe({
      next: (value) => {
        this.disableButton = false
        this.utilisateur = value
        this.identifiantsForm.get('email')!.setValue(this.utilisateur.email)
        this.identifiantsForm.get('identifiant')!.setValue(this.utilisateur.identifiant)
        this.identifiantsForm.get('nom')!.setValue(this.utilisateur.nom)
        this.identifiantsForm.get('prenoms')!.setValue(this.utilisateur.prenoms)
        this.identifiantsForm.get('contact')!.setValue(this.utilisateur.contact)
      },
      error: (err: HttpErrorResponse) => {
        this.disableButton = false
        console.log(err)
      }
    })
  }

  modifierIdentifiants(): void {
    this.identifiantsForm.markAllAsTouched()
    this.disableButton = true

    let nom: string = this.identifiantsForm.get('nom')!.value
    let prenoms: string = this.identifiantsForm.get('prenoms')!.value
    let contact: string = this.identifiantsForm.get('contact')!.value

    if (this.identifiantsForm.valid) {
      if ((nom != this.utilisateur?.nom || prenoms != this.utilisateur?.prenoms) || contact != this.utilisateur?.contact) {
        let utilisateur = new Utilisateur()
        utilisateur.nom = nom
        utilisateur.prenoms = prenoms
        utilisateur.contact = contact

        this.utilisateurService.update(utilisateur)
          .subscribe(
            {
              next: (res) => {
                console.log(res)
                this.disableButton = false
                this.identifiantsUpdateSuccess = true
                setTimeout(() => { this.identifiantsUpdateSuccess = false }, 2000)

                this.getUtilisateur()
              },
              error: (err: HttpErrorResponse) => {
                console.log(err.error)
                this.disableButton = false
                this.nomPrenomsAlreadyUsed = err.error.nomPrenomsAlreadyUsed
                this.identifiantsUpdateError = true

                setTimeout(() => {
                  this.nomPrenomsAlreadyUsed = false
                  this.identifiantsUpdateError = true
                }, 3000)
              },
            }
          )
      }
      else {
        this.disableButton = false
        console.error("Error");
      }
    }
    else {
      this.disableButton = false
      console.error("Error");
    }
  }

  modifierMotDePasse(): void {
    this.passwordForm.markAllAsTouched()
    this.disableButton = true

    if (this.passwordForm.valid) {
      if (this.passwordForm.get('password')!.value == this.passwordForm.get('confirmPassword')!.value) {
        let data = {
          oldPassword: this.passwordForm.get('oldPassword')!.value,
          password: this.passwordForm.get('password')!.value
        }

        this.authService.resetPassword(data).subscribe({
          next: (value) => {
            this.disableButton = false
            this.authService.logout()
          },
          error: (err: HttpErrorResponse) => {
            this.disableButton = false
            if (err.error.passwordWrong == true) {
              this.passwordWrongError = true

              setTimeout(() => {
                this.passwordWrongError = false
              }, 3000)
            }
            else {
              this.passwordUpdateError = true

              setTimeout(() => {
                this.passwordUpdateError = true
              }, 3000)
            }
          },
        })
      }
    }
    else {
      this.disableButton = false
    }
  }
}
