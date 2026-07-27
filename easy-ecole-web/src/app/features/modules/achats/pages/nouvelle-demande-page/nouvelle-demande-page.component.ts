import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-nouvelle-demande-page',
  templateUrl: './nouvelle-demande-page.component.html',
  styleUrls: ['./nouvelle-demande-page.component.scss']
})
export class NouvelleDemandePageComponent extends BaseComponentClass implements OnInit {
  loading = false
  saving = false
  lignes: any[] = [{ designation: '', quantite: '', prixEstime: '', unite: 'Unité' }]

  form: FormGroup = new FormGroup({
    description: new FormControl(null, [Validators.required]),
    validateurId: new FormControl(null, [Validators.required]),
  })

  constructor() { super() }

  ngOnInit(): void {}

  addLigne() {
    this.lignes.push({ designation: '', quantite: '', prixEstime: '', unite: 'Unité' })
  }

  removeLigne(index: number) {
    if (this.lignes.length > 1) {
      this.lignes.splice(index, 1)
    }
  }

  onSubmit() {
    if (this.form.invalid) return
    this.saving = true
    setTimeout(() => {
      this.saving = false
      alert('Demande soumise avec succès')
    }, 800)
  }
}
