import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { Etablissement } from 'src/app/data/modules/etablissement/models/Etablissement.model';
import { EtablissementService } from 'src/app/data/modules/etablissement/services/etablissement.service';
import { RegleEvaluation, RegleEvaluationService } from 'src/app/data/modules/inscription/services/regle-evaluation.service';

/**
 * Types de règles d'évaluation utilisés pour piloter les bulletins
 * (voir RegleEvaluation.model — enum `type`).
 */
type TypeRegle = 'note_minimale' | 'seuil_eliminatoire' | 'validation_credit' | 'compensation';

const REGLE_DEFAULTS: Record<TypeRegle, { valeur: string; estActif: boolean }> = {
  note_minimale: { valeur: '10', estActif: true },
  seuil_eliminatoire: { valeur: '7', estActif: true },
  validation_credit: { valeur: '60', estActif: true },
  compensation: { valeur: 'true', estActif: true },
};

@Component({
  selector: 'app-parametres-bulletins-page',
  templateUrl: './parametres-bulletins-page.component.html',
  styleUrls: ['./parametres-bulletins-page.component.scss']
})
export class ParametresBulletinsPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  saved: boolean = false;
  loading: boolean = false;
  saving: boolean = false;

  private regles: RegleEvaluation[] = [];

  constructor(
    private fb: FormBuilder,
    private etablissementService: EtablissementService,
    private regleEvaluationService: RegleEvaluationService,
    private toastService: ToastService
  ) {
    super();
    this.form = this.fb.group({
      enteteEcole: [''],
      enteteAdresse: [''],
      enteteTelephone: [''],
      enteteEmail: [''],
      piedPage: [''],
      afficherLogo: [true],
      afficherMoyenneClasse: [true],
      afficherRang: [true],
      afficherMention: [true],
      afficherAppreciation: [true],
      afficherSignature: [true],
      formatPapier: ['A4'],
      orientation: ['portrait'],
      noteMinimale: [REGLE_DEFAULTS.note_minimale.valeur],
      seuilEliminatoire: [REGLE_DEFAULTS.seuil_eliminatoire.valeur],
      creditsMinAnnee: [REGLE_DEFAULTS.validation_credit.valeur],
      compensationActive: [REGLE_DEFAULTS.compensation.valeur === 'true'],
    });
  }

  ngOnInit(): void {
    this.chargerDonnees();
  }

  private chargerDonnees(): void {
    this.loading = true;
    this.chargerEtablissement();
    this.chargerRegles();
  }

  private chargerEtablissement(): void {
    this.etablissementService.getEtablissement().subscribe({
      next: (etablissement) => {
        if (etablissement) {
          this.appliquerEtablissement(etablissement);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private appliquerEtablissement(etablissement: Etablissement): void {
    this.form.patchValue({
      enteteEcole: etablissement.nom ?? '',
      enteteAdresse: etablissement.adresse ?? '',
      enteteTelephone: etablissement.telephone ?? '',
      enteteEmail: etablissement.email ?? '',
      piedPage: `Bulletin officiel - Année scolaire ${etablissement.anneeScolaireCourante || ''}`.trim(),
    });
  }

  private chargerRegles(): void {
    this.regleEvaluationService.getAll().subscribe({
      next: (regles) => {
        this.regles = regles;
        this.appliquerRegles(regles);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private appliquerRegles(regles: RegleEvaluation[]): void {
    const regle = (type: string) => regles.find(r => r.type === type);

    const noteMinimale = regle('note_minimale');
    const seuilEliminatoire = regle('seuil_eliminatoire');
    const creditsMinAnnee = regle('validation_credit');
    const compensation = regle('compensation');

    // Si l'API est vide, on garde les valeurs par défaut documentées (10 / 7 / 60 / désactivée).
    this.form.patchValue({
      noteMinimale: noteMinimale ? noteMinimale.valeur : REGLE_DEFAULTS.note_minimale.valeur,
      seuilEliminatoire: seuilEliminatoire ? seuilEliminatoire.valeur : REGLE_DEFAULTS.seuil_eliminatoire.valeur,
      creditsMinAnnee: creditsMinAnnee ? creditsMinAnnee.valeur : REGLE_DEFAULTS.validation_credit.valeur,
      compensationActive: compensation ? compensation.valeur === 'true' : REGLE_DEFAULTS.compensation.valeur === 'true',
    });
  }

  onSave(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const etablissementValue = {
      nom: this.form.get('enteteEcole')?.value,
      adresse: this.form.get('enteteAdresse')?.value,
      telephone: this.form.get('enteteTelephone')?.value,
      email: this.form.get('enteteEmail')?.value,
    };

    this.etablissementService.getEtablissement().subscribe({
      next: (etablissement) => {
        this.sauvegarderEtablissement(etablissement, etablissementValue);
      },
      error: () => { this.saving = false; }
    });
  }

  private sauvegarderEtablissement(etablissement: Etablissement | null, value: Partial<Etablissement>): void {
    if (etablissement?.id) {
      this.etablissementService.update({ ...etablissement, ...value }).subscribe({
        next: () => this.sauvegarderRegles(),
        error: () => this.onSaveError()
      });
    } else {
      // Pas d'établissement existant : on ne peut pas le mettre à jour.
      // On persiste quand même les règles d'évaluation.
      this.sauvegarderRegles();
    }
  }

  private sauvegarderRegles(): void {
    const reglesToSave: RegleEvaluation[] = [
      { type: 'note_minimale', valeur: String(this.form.get('noteMinimale')?.value), description: 'Note minimale de validation' },
      { type: 'seuil_eliminatoire', valeur: String(this.form.get('seuilEliminatoire')?.value), description: 'Seuil éliminatoire' },
      { type: 'validation_credit', valeur: String(this.form.get('creditsMinAnnee')?.value), description: 'Crédits minimum par année' },
      { type: 'compensation', valeur: this.form.get('compensationActive')?.value ? 'true' : 'false', description: 'Compensation activée' },
    ];

    const observables = reglesToSave.map(regle => {
      const existing = this.regles.find(r => r.type === regle.type);
      if (existing) {
        return this.regleEvaluationService.update({ ...existing, ...regle });
      }
      return this.regleEvaluationService.create(regle);
    });

    // Sauvegarde séquentielle simple pour conserver l'ordre et la lisibilité.
    let index = 0;
    const next = () => {
      if (index >= observables.length) {
        this.onSaveSuccess();
        return;
      }
      observables[index].subscribe({ next: () => { index++; next(); }, error: () => this.onSaveError() });
    };
    next();
  }

  private onSaveSuccess(): void {
    this.saving = false;
    this.saved = true;
    this.toastService.success('Paramètres des bulletins enregistrés');
    this.etablissementService.reload();
    setTimeout(() => this.saved = false, 3000);
  }

  private onSaveError(): void {
    this.saving = false;
    this.toastService.error('Erreur lors de l\'enregistrement des paramètres');
  }

  resetForm(): void {
    // Réinitialise avec les valeurs serveur (ou les valeurs par défaut si non renseignées).
    this.form.reset({
      enteteEcole: '',
      enteteAdresse: '',
      enteteTelephone: '',
      enteteEmail: '',
      piedPage: '',
      afficherLogo: true,
      afficherMoyenneClasse: true,
      afficherRang: true,
      afficherMention: true,
      afficherAppreciation: true,
      afficherSignature: true,
      formatPapier: 'A4',
      orientation: 'portrait',
      noteMinimale: REGLE_DEFAULTS.note_minimale.valeur,
      seuilEliminatoire: REGLE_DEFAULTS.seuil_eliminatoire.valeur,
      creditsMinAnnee: REGLE_DEFAULTS.validation_credit.valeur,
      compensationActive: REGLE_DEFAULTS.compensation.valeur === 'true',
    });
    this.chargerDonnees();
  }
}
