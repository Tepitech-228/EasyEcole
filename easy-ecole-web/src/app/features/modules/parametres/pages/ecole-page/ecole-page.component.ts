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
  /** Vrai si le chargement de l'établissement a échoué (réseau / serveur). */
  erreurChargement: boolean = false

  etablissement: Etablissement | null = null

  /* Valeurs proposées dans les listes déroulantes. Si la valeur enregistrée
     n'y figure pas, elle est ajoutée à la volée pour ne rien perdre. */
  readonly typesEtablissement: string[] = [
    'Public',
    'Privé',
    'Privé confessionnel',
    'Privé laïc',
    'Institut',
    'Centre de formation professionnelle',
  ]

  readonly paysProposes: string[] = [
    'Bénin',
    'Burkina Faso',
    'Cameroun',
    'Côte d\'Ivoire',
    'Gabon',
    'Guinée',
    'Mali',
    'Niger',
    'Sénégal',
    'Tchad',
    'Togo',
  ]

  readonly devises: { code: string; libelle: string }[] = [
    { code: 'FCFA', libelle: 'FCFA — Franc CFA' },
    { code: 'XOF', libelle: 'XOF — Franc CFA (UEMOA)' },
    { code: 'XAF', libelle: 'XAF — Franc CFA (CEMAC)' },
    { code: 'EUR', libelle: 'EUR — Euro' },
    { code: 'USD', libelle: 'USD — Dollar américain' },
    { code: 'GBP', libelle: 'GBP — Livre sterling' },
    { code: 'MAD', libelle: 'MAD — Dirham marocain' },
    { code: 'GNF', libelle: 'GNF — Franc guinéen' },
  ]

  anneesScolaires: string[] = []

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
    site: new FormControl('', [Validators.required]),
  })

  constructor(
    private etablissementService: EtablissementService,
    private toastService: ToastService
  ) {
    super()
    this.construireAnneesScolaires()
  }

  ngOnInit(): void {
    this.chargerEtablissement()
  }

  /* ------------------------------------------------------------------ */
  /* Valeurs dérivées                                                    */
  /* ------------------------------------------------------------------ */

  /** Vrai tant qu'aucun établissement n'a été enregistré (création). */
  get estNouvelEtablissement(): boolean {
    return !this.etablissement?.id
  }

  /** Le code sert de base aux matricules : figé dès qu'un code existe. */
  get codeVerrouille(): boolean {
    return !!this.etablissement?.id && !!this.etablissement?.code
  }

  /** Aide au rendu des états d'erreur visuels sur les champs. */
  estInvalide(champ: string): boolean {
    const control = this.ecoleForm.get(champ)
    return !!control && control.invalid && (control.dirty || control.touched)
  }

  /* ------------------------------------------------------------------ */
  /* Chargement / formulaire                                             */
  /* ------------------------------------------------------------------ */

  chargerEtablissement(): void {
    this.loading = true
    this.erreurChargement = false
    this.etablissementService.getEtablissement().subscribe({
      next: (etablissement) => {
        this.etablissement = etablissement
        this.remplirFormulaire(etablissement)
        this.ecoleForm.markAsPristine()
        this.ecoleForm.markAsUntouched()
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.erreurChargement = true
        console.error(err)
      }
    })
  }

  /** Réinitialise le formulaire sur les valeurs actuellement enregistrées. */
  annuler(): void {
    this.remplirFormulaire(this.etablissement)
    this.ecoleForm.markAsPristine()
    this.ecoleForm.markAsUntouched()
  }

  save(): void {
    this.ecoleForm.markAllAsTouched()
    if (this.ecoleForm.invalid || this.saving) return
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
      site: this.ecoleForm.get('site')!.value,
    }

    const request = payload.id
      ? this.etablissementService.update(payload)
      : this.etablissementService.create(payload)

    request.subscribe({
      next: (saved) => {
        this.etablissement = saved
        this.saving = false
        this.success = true
        this.ecoleForm.markAsPristine()
        this.ecoleForm.markAsUntouched()
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

  /* ------------------------------------------------------------------ */
  /* Helpers privés                                                      */
  /* ------------------------------------------------------------------ */

  private remplirFormulaire(etablissement: Etablissement | null): void {
    this.ecoleForm.patchValue({
      nom: etablissement?.nom ?? '',
      type: etablissement?.type ?? '',
      code: etablissement?.code ?? '',
      email: etablissement?.email ?? '',
      telephone: etablissement?.telephone ?? '',
      adresse: etablissement?.adresse ?? '',
      ville: etablissement?.ville ?? '',
      pays: etablissement?.pays ?? '',
      devise: etablissement?.devise ?? 'FCFA',
      anneeScolaireCourante: etablissement?.anneeScolaireCourante ?? '',
      site: etablissement?.site ?? '',
    })

    // Conserve les valeurs historiques absentes des listes proposées.
    this.ajouterOptionSiAbsente(this.typesEtablissement, etablissement?.type)
    this.ajouterOptionSiAbsente(this.anneesScolaires, etablissement?.anneeScolaireCourante)
    this.ajouterDeviseSiAbsente(etablissement?.devise)
  }

  private ajouterOptionSiAbsente(liste: string[], valeur?: string | null): void {
    const valeurNettoyee = (valeur || '').trim()
    if (valeurNettoyee && liste.indexOf(valeurNettoyee) === -1) {
      liste.push(valeurNettoyee)
    }
  }

  private ajouterDeviseSiAbsente(valeur?: string | null): void {
    const code = (valeur || '').trim()
    if (code && !this.devises.some(devise => devise.code === code)) {
      this.devises.push({ code, libelle: code })
    }
  }

  /** Années scolaires autour de l'année courante (rentrée en août/septembre). */
  private construireAnneesScolaires(): void {
    const annee = new Date().getFullYear()
    const anneeDeRentree = new Date().getMonth() >= 7 ? annee : annee - 1
    const liste: string[] = []

    for (let decalage = -3; decalage <= 2; decalage++) {
      const debut = anneeDeRentree + decalage
      liste.push(`${debut}-${debut + 1}`)
    }

    this.anneesScolaires = liste
  }
}
