import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent extends BaseComponentClass {
  saving: boolean = false
  success: boolean = false

  form: FormGroup = new FormGroup({
    emailInscription: new FormControl(true),
    emailPaiement: new FormControl(true),
    emailAbsence: new FormControl(false),
    emailNotes: new FormControl(true),
    emailBulletins: new FormControl(true),
    smsInscription: new FormControl(false),
    smsPaiement: new FormControl(true),
    smsAbsence: new FormControl(false),
    smsNotes: new FormControl(false),
    rappelPaiement: new FormControl(true),
    rappelAbsence: new FormControl(true),
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
