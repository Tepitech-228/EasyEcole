import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EchelleNoteService } from '../../../../modules/bulletins/services/echelle-note.service';

@Component({
  selector: 'app-bareme-form-page',
  templateUrl: './bareme-form-page.component.html',
  styleUrls: ['./bareme-form-page.component.scss']
})
export class BaremeFormPageComponent extends BaseComponentClass implements OnInit {
  isEdit: boolean = false
  saving: boolean = false
  success: boolean = false
  loading: boolean = false
  loadFailed: boolean = false
  errorMessage = ''
  baremeId: string | null = null

  form: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    noteMin: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(20)]),
    noteMax: new FormControl(20, [Validators.required, Validators.min(0), Validators.max(20)]),
    mention: new FormControl('', [Validators.required]),
    appreciation: new FormControl(''),
  })

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private echelleNoteService: EchelleNoteService
  ) { super() }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true
        this.baremeId = params['id']
        this.chargerBareme(params['id'])
      }
    })
  }

  chargerBareme(id: string): void {
    this.loading = true
    this.echelleNoteService.getOne(Number(id)).subscribe({
      next: (echelle: any) => {
        this.form.patchValue({
          nom: echelle.libelle ?? '',
          noteMin: echelle.noteMin ?? 0,
          noteMax: echelle.noteMax ?? 20,
          mention: echelle.mention ?? '',
        })
        this.loading = false
      },
      error: () => {
        this.loading = false
        this.loadFailed = true
        this.errorMessage = 'Impossible de charger ce barème. Vous ne pouvez pas le modifier tant que le chargement a échoué.'
      }
    })
  }

  save(): void {
    if (this.form.invalid) return
    if (this.loadFailed) return
    if (Number(this.form.get('noteMin')!.value) > Number(this.form.get('noteMax')!.value)) {
      this.errorMessage = 'La note minimale doit être inférieure ou égale à la note maximale.'
      return
    }
    this.saving = true
    this.errorMessage = ''

    // Le modèle API EchelleNote n'expose pas "appréciation" : non envoyé.
    const payload: any = {
      libelle: this.form.get('nom')!.value,
      noteMin: Number(this.form.get('noteMin')!.value),
      noteMax: Number(this.form.get('noteMax')!.value),
      mention: this.form.get('mention')!.value,
      estActive: true,
      ordre: 0,
    }

    const request = this.isEdit && this.baremeId
      ? this.echelleNoteService.update(Number(this.baremeId), payload)
      : this.echelleNoteService.create(payload)

    request.subscribe({
      next: () => {
        this.saving = false
        this.success = true
        setTimeout(() => this.router.navigate(['../'], { relativeTo: this.route }), 1000)
      },
      error: (err) => {
        this.saving = false
        this.errorMessage = 'Le barème n’a pas pu être enregistré. Vérifiez les valeurs puis réessayez.'
        console.error(err)
      }
    })
  }
}
