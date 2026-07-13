import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-bareme-form-page',
  templateUrl: './bareme-form-page.component.html',
  styleUrls: ['./bareme-form-page.component.scss']
})
export class BaremeFormPageComponent extends BaseComponentClass implements OnInit {
  isEdit: boolean = false
  saving: boolean = false
  success: boolean = false

  form: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    noteMin: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(20)]),
    noteMax: new FormControl(20, [Validators.required, Validators.min(0), Validators.max(20)]),
    mention: new FormControl('', [Validators.required]),
    appreciation: new FormControl(''),
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
