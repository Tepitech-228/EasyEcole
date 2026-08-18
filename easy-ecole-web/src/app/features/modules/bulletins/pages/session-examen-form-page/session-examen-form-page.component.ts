import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SessionExamenService } from '../../services/session-examen.service';
import { RattrapageService } from '../../services/rattrapage.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';

@Component({
  selector: 'app-session-examen-form-page',
  templateUrl: './session-examen-form-page.component.html',
  styleUrls: ['./session-examen-form-page.component.scss']
})
export class SessionExamenFormPageComponent extends BaseComponentClass implements OnInit, OnDestroy {
  form: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  submitted = false;
  loading = false;
  saving = false;

  types = ['normale', 'rattrapage'];
  semestres = ['semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'];
  statuts = ['planifiee', 'en_cours', 'terminee', 'cloturee'];

  // Correcteurs par cours (session de rattrapage)
  coursDeLaClasse: any[] = [];
  enseignants: any[] = [];
  correcteurs: { coursId: number; enseignantId: string }[] = [];
  loadingCours = false;

  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: SessionExamenService,
    private rattrapageService: RattrapageService,
    private coursService: CoursService
  ) {
    super();
    this.form = this.fb.group({
      libelle: ['', Validators.required],
      type: ['', Validators.required],
      classeId: [null, Validators.required],
      anneeAcademiqueId: [null, Validators.required],
      semestre: ['', Validators.required],
      dateDebut: [''],
      dateFin: [''],
      statut: ['planifiee'],
      observations: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.itemId = Number(id);
      this.loading = true;
      this.service.getOne(this.itemId).subscribe({
        next: (res) => {
          this.form.patchValue(res);
          this.loading = false;
          if (res.type === 'rattrapage') {
            this.chargerCoursEtCorrecteurs();
          }
        },
        error: () => { this.loading = false; }
      });
    }

    this.subs.push(
      this.form.get('type')!.valueChanges.subscribe(() => this.surChangementTypeOuClasse())
    );
    this.subs.push(
      this.form.get('classeId')!.valueChanges.subscribe(() => this.surChangementTypeOuClasse())
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private surChangementTypeOuClasse(): void {
    if (this.form.get('type')!.value === 'rattrapage' && this.form.get('classeId')!.value) {
      this.chargerCoursEtCorrecteurs();
    }
  }

  private chargerCoursEtCorrecteurs(): void {
    const classeId = this.form.get('classeId')!.value;
    if (!classeId) return;
    this.loadingCours = true;
    this.coursService.getAllPaginated({ classeId: String(classeId) }).subscribe({
      next: (res: any) => {
        this.coursDeLaClasse = res.data || res || [];
        this.loadingCours = false;
      },
      error: () => { this.coursDeLaClasse = []; this.loadingCours = false; }
    });

    // Enseignants disponibles pour la désignation des correcteurs
    this.rattrapageService.getEnseignantsDisponibles().subscribe({
      next: (res) => { this.enseignants = res; },
      error: () => { this.enseignants = []; }
    });

    // Correcteurs déjà désignés (édition)
    if (this.isEditMode && this.itemId) {
      this.service.getCorrecteurs(this.itemId).subscribe({
        next: (res) => {
          this.correcteurs = (res || []).map((c: any) => ({
            coursId: c.coursId,
            enseignantId: c.enseignantId
          }));
        },
        error: () => { this.correcteurs = []; }
      });
    }
  }

  getCorrecteur(coursId: number): string {
    return this.correcteurs.find(c => c.coursId === coursId)?.enseignantId || '';
  }

  onCorrecteurChange(coursId: number, enseignantId: string): void {
    const idx = this.correcteurs.findIndex(c => c.coursId === coursId);
    if (idx >= 0) {
      if (enseignantId) this.correcteurs[idx].enseignantId = enseignantId;
      else this.correcteurs.splice(idx, 1);
    } else if (enseignantId) {
      this.correcteurs.push({ coursId, enseignantId });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.saving = true;
    const data = { ...this.form.value };
    const obs = this.isEditMode
      ? this.service.update(this.itemId!, data)
      : this.service.create(data);
    obs.subscribe({
      next: (res: any) => {
        const sessionId = this.isEditMode ? this.itemId! : res.id;
        const correcteursAEnvoyer = this.form.get('type')!.value === 'rattrapage'
          ? this.correcteurs.filter(c => c.coursId && c.enseignantId)
          : [];
        if (correcteursAEnvoyer.length) {
          this.service.saveCorrecteurs(sessionId, correcteursAEnvoyer).subscribe({
            next: () => this.router.navigate(['/bulletins/sessions']),
            error: () => this.saving = false
          });
        } else {
          this.router.navigate(['/bulletins/sessions']);
        }
      },
      error: () => { this.saving = false; }
    });
  }

  annuler(): void { this.router.navigate(['/bulletins/sessions']); }
}
