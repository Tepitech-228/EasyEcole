import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-systeme-page',
  templateUrl: './systeme-page.component.html',
  styleUrls: ['./systeme-page.component.scss']
})
export class SystemePageComponent extends BaseComponentClass {
  saving: boolean = false
  success: boolean = false

  form: FormGroup = new FormGroup({
    langue: new FormControl('fr'),
    fuseauHoraire: new FormControl('Africa/Douala'),
    formatDate: new FormControl('dd/MM/yyyy'),
    politesseMotDePasse: new FormControl('8car'),
    sessionTimeout: new FormControl(60),
    modeMaintenance: new FormControl(false),
    inscriptionOuverte: new FormControl(true),
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
