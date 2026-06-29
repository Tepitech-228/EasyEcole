import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-frais-form-page',
  templateUrl: './frais-form-page.component.html',
  styleUrls: ['./frais-form-page.component.scss']
})
export class FraisFormPageComponent extends BaseComponentClass implements OnInit {
  isEdit: boolean = false
  saving: boolean = false
  success: boolean = false

  form: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    montant: new FormControl(0, [Validators.required, Validators.min(0)]),
    periodicite: new FormControl('Annuel', [Validators.required]),
    description: new FormControl(''),
    actif: new FormControl(true),
  })

  constructor(private route: ActivatedRoute, private router: Router) { super() }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true
      }
    })
  }

  save(): void {
    this.saving = true
    setTimeout(() => {
      this.saving = false
      this.success = true
      setTimeout(() => this.router.navigate(['../'], { relativeTo: this.route }), 1500)
    }, 1000)
  }
}
