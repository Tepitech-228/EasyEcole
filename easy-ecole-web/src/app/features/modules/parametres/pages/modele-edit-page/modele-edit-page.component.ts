import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-modele-edit-page',
  templateUrl: './modele-edit-page.component.html',
  styleUrls: ['./modele-edit-page.component.scss']
})
export class ModeleEditPageComponent extends BaseComponentClass implements OnInit {
  saving: boolean = false
  success: boolean = false
  modeleId: string = ''

  form: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    sujet: new FormControl('', [Validators.required]),
    contenu: new FormControl('', [Validators.required]),
  })

  constructor(private route: ActivatedRoute) { super() }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.modeleId = params['id'] || ''
    })
  }

  save(): void {
    this.saving = true
    setTimeout(() => {
      this.saving = false
      this.success = true
      setTimeout(() => this.success = false, 3000)
    }, 1000)
  }
}
