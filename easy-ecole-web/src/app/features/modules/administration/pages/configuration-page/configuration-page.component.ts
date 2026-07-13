import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-configuration-page',
  templateUrl: './configuration-page.component.html',
  styleUrls: ['./configuration-page.component.scss']
})
export class ConfigurationPageComponent extends BaseComponentClass {
  saving: boolean = false
  success: boolean = false

  form: FormGroup = new FormGroup({
    maintenance: new FormControl(false),
    inscriptionLibre: new FormControl(true),
    validationInscription: new FormControl('auto'),
    nbMaxEtudiants: new FormControl(5000),
    securiteMdp: new FormControl('moyen'),
    sessionTimeout: new FormControl(60),
    tentativesMax: new FormControl(5),
    stockActif: new FormControl(true),
    immobilisationsActif: new FormControl(true),
    pointageActif: new FormControl(true),
  })

  constructor() { super() }

  save(): void {
    this.saving = true
    setTimeout(() => {
      this.saving = false
      this.success = true
      setTimeout(() => this.success = false, 3000)
    }, 800)
  }
}
