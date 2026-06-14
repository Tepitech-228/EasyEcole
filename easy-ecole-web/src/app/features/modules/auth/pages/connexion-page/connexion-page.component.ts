import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';

@Component({
  selector: 'app-connexion-page',
  templateUrl: './connexion-page.component.html',
  styleUrls: ['./connexion-page.component.scss']
})
export class ConnexionPageComponent implements OnInit {

  emptyError: boolean = false
  error: boolean = false
  disableButton: boolean = false

  connexionForm: FormGroup = new FormGroup({
    usernameOrEmail: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [Validators.required, Validators.minLength(8)]),
  })

  constructor(private authService: AuthService, private localStorageService: LocalStorageService) { }

  ngOnInit(): void {
  }

  connexion(): void {
    this.disableButton = true

    let identifiant: string = this.connexionForm.get('usernameOrEmail')?.value
    let password: string = this.connexionForm.get('password')?.value
    console.log(identifiant, password)

    if (identifiant == null || password == null || identifiant.length == 0 || password.length == 0) {
      this.emptyError = true

      setTimeout(() => {
        this.emptyError = false
      }, 3000)
      this.disableButton = false
    }
    else {
      let utilisateur = new Utilisateur()
      utilisateur.email = identifiant
      utilisateur.identifiant = identifiant
      utilisateur.motDePasse = password

      this.authService.login(utilisateur)
        .subscribe(
          {
            next: (res) => {
              this.disableButton = false
              this.localStorageService.set(LocalStorageService.AUTH_TOKEN, res.token)

              location.reload()
            },
            error: (err) => {
              this.disableButton = false
              this.error = true

              setTimeout(() => {
                this.error = false
              }, 3000)
            },
          }
        )
    }
  }
}