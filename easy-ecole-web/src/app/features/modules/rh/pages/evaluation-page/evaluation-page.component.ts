import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhCritereEvaluation } from 'src/app/data/modules/rh/models/RhCritereEvaluation.model';
import { RhEmploye } from 'src/app/data/modules/rh/models/RhEmploye.model';
import { RhFicheEvaluation } from 'src/app/data/modules/rh/models/RhFicheEvaluation.model';
import { RhCritereEvaluationService } from 'src/app/data/modules/rh/services/rh-critere-evaluation.service';
import { RhEvaluationCritereService } from 'src/app/data/modules/rh/services/rh-evaluation-critre.service';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { RhFicheEvaluationService } from 'src/app/data/modules/rh/services/rh-fiche-evaluation.service';

@Component({
  selector: 'app-evaluation-page',
  templateUrl: './evaluation-page.component.html',
  styleUrls: ['./evaluation-page.component.scss']
})
export class EvaluationPageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  saving = false;
  isEdit = false;
  ficheId: string | null = null;

  employes: RhEmploye[] = [];
  criteres: RhCritereEvaluation[] = [];

  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private ficheService: RhFicheEvaluationService,
    private employeService: RhEmployeService,
    private critereService: RhCritereEvaluationService,
    private evaluationCritereService: RhEvaluationCritereService
  ) { super() }

  ngOnInit(): void {
    this.ficheId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.ficheId;

    this.initForm();
    this.loadReferentiel();

    if (this.isEdit && this.ficheId) {
      this.loadEvaluation(this.ficheId);
    } else {
      this.loading = false;
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      employeId: ['', Validators.required],
      evaluateurId: ['', Validators.required],
      dateEvaluation: [new Date().toISOString().slice(0, 10), Validators.required],
      commentaire: [''],
      notes: this.fb.array([])
    });
  }

  private get notes(): FormArray {
    return this.form.get('notes') as FormArray;
  }

  private loadReferentiel(): void {
    this.employeService.getAll().subscribe({
      next: (data) => { this.employes = (data || []) as RhEmploye[]; },
      error: () => { this.employes = []; }
    });
    this.critereService.getAll().subscribe({
      next: (data) => {
        this.criteres = data || [];
        this.buildNotesControls();
      },
      error: () => { this.criteres = []; }
    });
  }

  /** Construit un contrôle de note par critère. */
  private buildNotesControls(): void {
    while (this.notes.length) { this.notes.removeAt(0); }
    this.criteres.forEach(() => {
      this.notes.push(this.fb.group({ note: [null, Validators.required] }));
    });
  }

  /** En édition : charge la fiche GET /fh/fiches-evaluation/:id + pré-remplit les notes. */
  loadEvaluation(id: string) {
    this.ficheService.get(id).subscribe({
      next: (data: RhFicheEvaluation) => {
        this.form.patchValue({
          employeId: data.employeId || '',
          evaluateurId: data.evaluateurId || '',
          dateEvaluation: (data.dateEvaluation || new Date().toISOString().slice(0, 10)).slice(0, 10),
          commentaire: data.commentaire || ''
        });

        // Les critères sont peut-être déjà chargés (chargement concurrent).
        // On ne pré-remplit les notes que lorsqu'ils sont disponibles.
        if (this.criteres.length) {
          this.prefillNotes(data);
          this.loading = false;
        } else {
          const sub = this.critereService.getAll().subscribe({
            next: (crits) => {
              this.criteres = crits || [];
              this.buildNotesControls();
              this.prefillNotes(data);
              this.loading = false;
            },
            error: () => { this.loading = false; }
          });
          // évite les fuites si loadEvaluation est appelé plusieurs fois
          if (!this.notes.length) { /* kept alive until completion */ }
        }
      },
      error: () => { this.loading = false; }
    });
  }

  private prefillNotes(data: RhFicheEvaluation): void {
    const map = new Map<string, number>();
    (data.evaluationsCriteres || []).forEach((ec) => {
      const critId = ec.critereId ?? ec.critere?.id;
      if (critId != null) map.set(String(critId), Number(ec.note));
    });
    this.criteres.forEach((c, i) => {
      const value = map.has(String(c.id)) ? map.get(String(c.id)) : null;
      this.notes.at(i).patchValue({ note: value ?? null });
    });
  }

  employeLabel(emp: RhEmploye): string {
    if (emp.prenoms || emp.nom) return [emp.prenoms, emp.nom].filter(Boolean).join(' ').trim();
    return emp.matricule || `#${emp.id}`;
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving = true;

    const payload: RhFicheEvaluation = {
      employeId: this.form.value.employeId,
      evaluateurId: this.form.value.evaluateurId,
      dateEvaluation: this.form.value.dateEvaluation,
      commentaire: this.form.value.commentaire || null
    };

    const op$ = this.isEdit
      ? this.ficheService.update({ ...payload, id: this.ficheId! })
      : this.ficheService.create(payload);

    op$.subscribe({
      next: (fiche) => this.saveCriteres(fiche.id!),
      error: () => {
        this.saving = false;
        alert("Erreur lors de l'enregistrement de l'évaluation");
      }
    });
  }

  /** Crée chaque évaluation par critère via /rh/evaluations-criteres. */
  private saveCriteres(ficheId: string): void {
    const calls: any[] = [];
    this.criteres.forEach((c, i) => {
      const note = Number(this.notes.at(i).value.note);
      calls.push(this.evaluationCritereService.create({ ficheId, critereId: c.id, note }));
    });

    // Souscription séquentielle simple : on enchaîne les POST, puis on finalise.
    let idx = 0;
    const next = (hasError: boolean) => {
      if (hasError) { this.finalizeSave(true); return; }
      idx += 1;
      if (idx >= calls.length) { this.finalizeSave(false); return; }
      calls[idx].subscribe({ next: () => next(false), error: () => next(true) });
    };
    if (calls.length) {
      calls[0].subscribe({ next: () => next(false), error: () => next(true) });
    } else {
      this.finalizeSave(false);
    }
  }

  private finalizeSave(hasError = false): void {
    this.saving = false;
    if (hasError) {
      alert('Évaluation enregistrée mais erreur sur un critère');
    } else {
      alert(this.isEdit ? 'Évaluation modifiée' : 'Évaluation créée');
    }
  }
}