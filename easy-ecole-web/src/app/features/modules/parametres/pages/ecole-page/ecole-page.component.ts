import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { Etablissement } from 'src/app/data/modules/etablissement/models/Etablissement.model';
import { EtablissementService } from 'src/app/data/modules/etablissement/services/etablissement.service';

@Component({
  selector: 'app-ecole-page',
  templateUrl: './ecole-page.component.html',
  styleUrls: ['./ecole-page.component.scss']
})
export class EcolePageComponent extends BaseComponentClass implements OnInit {
  saving: boolean = false
  success: boolean = false
  loading: boolean = false

  etablissement: Etablissement | null = null

  ecoleForm: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    type: new FormControl(''),
    code: new FormControl(''),
    email: new FormControl('', [Validators.email]),
    telephone: new FormControl(''),
    adresse: new FormControl(''),
    ville: new FormControl(''),
    pays: new FormControl(''),
    devise: new FormControl('FCFA'),
    anneeScolaireCourante: new FormControl(''),
  })

  constructor(
    private etablissementService: EtablissementService,
    private toastService: ToastService
  ) { super() }

  ngOnInit(): void {
    this.chargerEtablissement()
  }

  chargerEtablissement(): void {
    this.loading = true
    this.etablissementService.getEtablissement().subscribe({
      next: (etablissement) => {
        this.etablissement = etablissement
        if (etablissement) {
          this.ecoleForm.patchValue({
            nom: etablissement.nom ?? '',
            type: etablissement.type ?? '',
            code: etablissement.code ?? '',
            email: etablissement.email ?? '',
            telephone: etablissement.telephone ?? '',
            adresse: etablissement.adresse ?? '',
            ville: etablissement.ville ?? '',
            pays: etablissement.pays ?? '',
            devise: etablissement.devise ?? 'FCFA',
            anneeScolaireCourante: etablissement.anneeScolaireCourante ?? '',
          })
        }
        this.loading = false
      },
      error: () => {
        this.loading = false
      }
    })
  }

  save(): void {
    if (this.ecoleForm.invalid) return
    this.saving = true

    const payload: Etablissement = {
      ...this.etablissement,
      nom: this.ecoleForm.get('nom')!.value,
      type: this.ecoleForm.get('type')!.value,
      code: this.ecoleForm.get('code')!.value,
      email: this.ecoleForm.get('email')!.value,
      telephone: this.ecoleForm.get('telephone')!.value,
      adresse: this.ecoleForm.get('adresse')!.value,
      ville: this.ecoleForm.get('ville')!.value,
      pays: this.ecoleForm.get('pays')!.value,
      devise: this.ecoleForm.get('devise')!.value || 'FCFA',
      anneeScolaireCourante: this.ecoleForm.get('anneeScolaireCourante')!.value,
    }

    const request = payload.id
      ? this.etablissementService.update(payload)
      : this.etablissementService.create(payload)

    request.subscribe({
      next: (saved) => {
        this.etablissement = saved
        this.saving = false
        this.success = true
        this.toastService.success('Paramètres de l\'établissement enregistrés')
        this.etablissementService.reload()
        setTimeout(() => this.success = false, 3000)
      },
      error: (err) => {
        this.saving = false
        this.toastService.error('Erreur lors de l\'enregistrement')
        console.error(err)
      }
    })
  }
}
