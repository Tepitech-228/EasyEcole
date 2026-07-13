import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-ecole-page',
  templateUrl: './ecole-page.component.html',
  styleUrls: ['./ecole-page.component.scss']
})
export class EcolePageComponent extends BaseComponentClass implements OnInit {
  saving: boolean = false
  success: boolean = false

  ecoleForm: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    acronym: new FormControl(''),
    email: new FormControl('', [Validators.email]),
    telephone: new FormControl(''),
    adresse: new FormControl(''),
    ville: new FormControl(''),
    pays: new FormControl(''),
    devise: new FormControl('FCFA'),
    anneScolaireCourante: new FormControl(''),
  })

  constructor() { super() }

  ngOnInit(): void { }

  save(): void {
    this.saving = true
    setTimeout(() => {
      this.saving = false
      this.success = true
      setTimeout(() => this.success = false, 3000)
    }, 1000)
  }
}
