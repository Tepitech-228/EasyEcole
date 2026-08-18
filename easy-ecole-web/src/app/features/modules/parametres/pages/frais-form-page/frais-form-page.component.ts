import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { FraisInscriptionService } from 'src/app/data/modules/inscription/services/frais-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';

@Component({
  selector: 'app-frais-form-page',
  templateUrl: './frais-form-page.component.html',
  styleUrls: ['./frais-form-page.component.scss']
})
export class FraisFormPageComponent extends BaseComponentClass implements OnInit {
  isEdit: boolean = false
  saving: boolean = false
  success: boolean = false
  loading: boolean = false
  fraisId: string | null = null
  sessions: Session[] = []

  form: FormGroup = new FormGroup({
    nom: new FormControl('', [Validators.required]),
    montant: new FormControl(0, [Validators.required, Validators.min(0)]),
    periodicite: new FormControl('Annuel', [Validators.required]),
    description: new FormControl(''),
    actif: new FormControl(true),
    sessionId: new FormControl(null, [Validators.required]),
  })

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fraisInscriptionService: FraisInscriptionService,
    private sessionService: SessionService
  ) { super() }

  ngOnInit(): void {
    this.chargerSessions()
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true
        this.fraisId = params['id']
        this.chargerFrais(params['id'])
      }
    })
  }

  chargerSessions(): void {
    this.sessionService.getAll().subscribe({
      next: (sessions) => { this.sessions = sessions },
      error: () => { this.sessions = [] }
    })
  }

  getSessionLabel(session: Session): string {
    const annee = session.anneeAcademique?.libelle
    const niveau = session.niveauEtude?.libelle
    const libelle = [annee, niveau].filter(Boolean).join(' - ')
    return libelle || session.description || session.id
  }

  chargerFrais(id: string): void {
    this.loading = true
    this.fraisInscriptionService.get(id).subscribe({
      next: (frais: any) => {
        this.form.patchValue({
          nom: frais.titre ?? '',
          montant: frais.montant ?? 0,
          description: frais.description ?? '',
          actif: !!frais.fraisDesCours,
          sessionId: frais.sessionId ?? null,
        })
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

    // Le modèle API (FraisInscription) n'expose pas "periodicite" : non envoyé.
    const payload: any = {
      titre: this.form.get('nom')!.value,
      montant: Number(this.form.get('montant')!.value),
      description: this.form.get('description')!.value,
      fraisDesCours: !!this.form.get('actif')!.value,
      sessionId: this.form.get('sessionId')!.value,
    }

    const request = this.isEdit && this.fraisId
      ? this.fraisInscriptionService.update({ id: this.fraisId, ...payload })
      : this.fraisInscriptionService.create(payload)

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
