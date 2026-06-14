import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';

@Component({
  selector: 'app-inscription-page',
  templateUrl: './inscription-page.component.html',
  styleUrls: ['./inscription-page.component.scss']
})
export class InscriptionPageComponent implements OnInit {

  emptyError: boolean = false
  error: boolean = false
  disableButton: boolean = false
  confirmError: boolean = false
  passwordError: boolean = false

  emailAlreadyUsed: boolean = false
  identifiantAlreadyUsed: boolean = false
  nomPrenomsAlreadyUsed: boolean = false

  inscriptionForm: FormGroup = new FormGroup({
    nom: new FormControl(null, [Validators.required]),
    prenoms: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.email, Validators.required]),
    identifiant: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl(null, [Validators.required, Validators.minLength(8)]),
  })

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  inscription(): void {
    this.disableButton = true

    let nom: string = this.inscriptionForm.get('nom')?.value
    let prenoms: string = this.inscriptionForm.get('prenoms')?.value
    let email: string = this.inscriptionForm.get('email')?.value
    let identifiant: string = this.inscriptionForm.get('identifiant')?.value
    let password: string = this.inscriptionForm.get('password')?.value
    let confirmPassword: string = this.inscriptionForm.get('confirmPassword')?.value

    if (nom == null || prenoms == null || email == null || identifiant == null || password == null || confirmPassword == null
      || nom.length == 0 || prenoms.length == 0 || email.length == 0 || identifiant.length == 0 || password.length == 0 || confirmPassword.length == 0) {
      this.emptyError = true

      setTimeout(() => {
        this.emptyError = false
      }, 3000)
      this.disableButton = false
    }
    else {
      if (password.length < 8) {
        this.passwordError = true
        setTimeout(() => {
          this.passwordError = false
        }, 3000)
        this.disableButton = false
      }
      else if (password != confirmPassword) {
        this.confirmError = true
        setTimeout(() => {
          this.confirmError = false
        }, 3000)
        this.disableButton = false
      }
      else {
        let utilisateur = new Utilisateur()
        utilisateur.nom = nom
        utilisateur.prenoms = prenoms
        utilisateur.email = email
        utilisateur.identifiant = identifiant
        utilisateur.motDePasse = password

        this.authService.register(utilisateur)
          .subscribe(
            {
              next: (res) => {
                this.disableButton = false
                this.router.navigateByUrl("/auth/connexion")
              },
              error: (err: HttpErrorResponse) => {
                console.log(err.error)
                this.disableButton = false
                this.emailAlreadyUsed = err.error.emailAlreadyUsed
                this.identifiantAlreadyUsed = err.error.identifiantAlreadyUsed
                this.nomPrenomsAlreadyUsed = err.error.nomPrenomsAlreadyUsed
                if (!this.emailAlreadyUsed && !this.identifiantAlreadyUsed && !this.nomPrenomsAlreadyUsed) {
                  this.error = true
                }

                setTimeout(() => {
                  this.error = false
                  this.emailAlreadyUsed = false
                  this.identifiantAlreadyUsed = false
                  this.nomPrenomsAlreadyUsed = false
                }, 3000)
              },
            }
          )
      }
    }
  }

}
