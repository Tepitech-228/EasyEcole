import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SessionExamenService } from '../../services/session-examen.service';
import { RattrapageService } from '../../services/rattrapage.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';

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
  errorMessage = '';

  types = ['normale', 'rattrapage'];
  semestres = ['semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'];
  // Correcteurs par cours (session de rattrapage)
  coursDeLaClasse: any[] = [];
  enseignants: any[] = [];
  correcteurs: { coursId: number; enseignantId: string }[] = [];
  loadingCours = false;

  classes: any[] = [];
  anneesAcademiques: any[] = [];
  loadingClasses = false;
  loadingAnnees = false;

  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: SessionExamenService,
    private rattrapageService: RattrapageService,
    private coursService: CoursService,
    private classeService: ClasseService,
    private anneeAcademiqueService: AnneeAcademiqueService
  ) {
    super();
    this.form = this.fb.group({
      libelle: ['', Validators.required],
      type: ['', Validators.required],
      classeIds: [[], Validators.required],
      anneeAcademiqueId: [null, Validators.required],
      semestre: ['', Validators.required],
      dateDebut: [''],
      dateFin: [''],
      observations: [''],
    });
  }

  ngOnInit(): void {
    this.chargerClasses();
    this.chargerAnneesAcademiques();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.itemId = Number(id);
      this.loading = true;
      this.service.getOne(this.itemId).subscribe({
        next: (res) => {
          this.form.patchValue({
            ...res,
            classeIds: res.classesCibles?.map((classe: any) => Number(classe.id)) || [Number(res.classeId)]
          });
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
      this.form.get('classeIds')!.valueChanges.subscribe(() => this.surChangementTypeOuClasse())
    );
  }

  private chargerClasses(): void {
    this.loadingClasses = true;
    this.classeService.getAll().subscribe({
      next: (res: any) => {
        this.classes = Array.isArray(res) ? res : (res?.data || []);
        this.loadingClasses = false;
      },
      error: () => { this.classes = []; this.loadingClasses = false; }
    });
  }

  private chargerAnneesAcademiques(): void {
    this.loadingAnnees = true;
    this.anneeAcademiqueService.getAll().subscribe({
      next: (res: any) => {
        this.anneesAcademiques = Array.isArray(res) ? res : (res?.data || []);
        this.loadingAnnees = false;
      },
      error: () => { this.anneesAcademiques = []; this.loadingAnnees = false; }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private surChangementTypeOuClasse(): void {
    if (this.form.get('type')!.value === 'rattrapage' && this.form.get('classeIds')!.value?.length) {
      this.chargerCoursEtCorrecteurs();
    }
  }

  private chargerCoursEtCorrecteurs(): void {
    const classeIds = (this.form.get('classeIds')!.value || []).map(Number);
    if (!classeIds.length) {
      this.coursDeLaClasse = [];
      return;
    }
    this.loadingCours = true;
    forkJoin(classeIds.map(classeId => this.coursService.getAllPaginated({ classeId: String(classeId) }))).subscribe({
      next: (responses: any[]) => {
        this.coursDeLaClasse = responses.reduce((cours: any[], res: any) => {
          const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          return cours.concat(items);
        }, []);
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
    this.errorMessage = '';
    const data = {
      ...this.form.value,
      classeIds: this.form.get('classeIds')!.value.map(Number),
      classeId: Number(this.form.get('classeIds')!.value[0])
    };
    const obs = this.isEditMode
      ? this.service.update(this.itemId!, data)
      : this.service.create(data);
    obs.subscribe({
      next: (res: any) => {
        const sessionId = this.isEditMode ? this.itemId! : res.id;
        const correcteursAEnvoyer = this.form.get('type')!.value === 'rattrapage'
          ? this.correcteurs.filter(c => c.coursId && c.enseignantId)
          : [];
        if (this.form.get('type')!.value === 'rattrapage') {
          this.service.saveCorrecteurs(sessionId, correcteursAEnvoyer).subscribe({
            next: () => this.router.navigate(['/bulletins/sessions']),
            error: () => {
              this.errorMessage = 'La session a été enregistrée, mais les correcteurs n’ont pas pu être enregistrés. Réessayez sans recréer la session.';
              this.saving = false;
            }
          });
        } else {
          this.router.navigate(['/bulletins/sessions']);
        }
      },
      error: () => {
        this.errorMessage = 'La session n’a pas pu être enregistrée. Vérifiez les informations puis réessayez.';
        this.saving = false;
      }
    });
  }

  annuler(): void { this.router.navigate(['/bulletins/sessions']); }
}
