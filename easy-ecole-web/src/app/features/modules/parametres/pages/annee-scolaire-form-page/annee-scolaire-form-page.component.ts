import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-annee-scolaire-form-page',
  templateUrl: './annee-scolaire-form-page.component.html',
  styleUrls: ['./annee-scolaire-form-page.component.scss']
})
export class AnneeScolaireFormPageComponent extends BaseComponentClass implements OnInit {
  saving: boolean = false
  success: boolean = false
  isEdit: boolean = false

  form: FormGroup = new FormGroup({
    libelle: new FormControl('', [Validators.required]),
    dateDebut: new FormControl('', [Validators.required]),
    dateFin: new FormControl('', [Validators.required]),
    estCourante: new FormControl(false),
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
