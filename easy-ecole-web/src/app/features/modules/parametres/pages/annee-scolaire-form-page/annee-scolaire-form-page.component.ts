import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';

@Component({
  selector: 'app-annee-scolaire-form-page',
  templateUrl: './annee-scolaire-form-page.component.html',
  styleUrls: ['./annee-scolaire-form-page.component.scss']
})
export class AnneeScolaireFormPageComponent extends BaseComponentClass implements OnInit {
  saving: boolean = false
  success: boolean = false
  isEdit: boolean = false
  loading: boolean = false
  anneeId: string | null = null

  form: FormGroup = new FormGroup({
    libelle: new FormControl('', [Validators.required]),
    dateDebut: new FormControl('', [Validators.required]),
    dateFin: new FormControl('', [Validators.required]),
    estCourante: new FormControl(false),
  })

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private anneeAcademiqueService: AnneeAcademiqueService
  ) { super() }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true
        this.anneeId = params['id']
        this.chargerAnnee(params['id'])
      }
    })
  }

  chargerAnnee(id: string): void {
    this.loading = true
    this.anneeAcademiqueService.get(id).subscribe({
      next: (annee) => {
        // L'API n'expose que libelle + description (pas de dates ni "année courante").
        this.form.patchValue({ libelle: annee.libelle ?? '' })
        this.loading = false
      },
      error: () => {
        this.loading = false
      }
    })
  }

  save(): void {
    if (this.form.invalid) return
    this.saving = true

    // Les colonnes dateDebut/dateFin/estCourante ne sont pas persistées :
    // le modèle backend AnneeAcademique n'expose que libelle + description.
    const payload: any = {
      libelle: this.form.get('libelle')!.value,
      description: this.form.get('libelle')!.value,
    }

    const request = this.isEdit && this.anneeId
      ? this.anneeAcademiqueService.update({ id: this.anneeId, ...payload })
      : this.anneeAcademiqueService.create(payload)

    request.subscribe({
      next: () => {
        this.saving = false
        this.success = true
        setTimeout(() => this.router.navigate(['../'], { relativeTo: this.route }), 1000)
      },
      error: (err) => {
        this.saving = false
        console.error(err)
      }
    })
  }
}
