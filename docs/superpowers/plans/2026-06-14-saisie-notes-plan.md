# Saisie de notes d'évaluation — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Permettre aux enseignants et admins de créer des évaluations et saisir les notes des étudiants.

**Architecture:** 2 nouvelles pages (création d'évaluation + saisie des notes), 1 nouveau service frontend (TypeNoteEvaluationService). Les routes sont ajoutées sous `/cours/notes/`.

**Tech Stack:** Angular 20+, Angular Forms (ReactiveFormsModule), Angular Router

---

### Task 1: Créer le service TypeNoteEvaluationService

**Files:**
- Create: `src/app/data/modules/inscription/services/type-note-evaluation.service.ts`

- [ ] **Create the service**

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TypeNoteEvaluation } from '../models/TypeNoteEvaluation.model';

@Injectable({ providedIn: 'root' })
export class TypeNoteEvaluationService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/typesNoteEvaluation`
  constructor(private httpClient: HttpClient) { }
  getAll(): Observable<TypeNoteEvaluation[]> { return this.httpClient.get<TypeNoteEvaluation[]>(`${this.SERVICE_URL}`) }
  get(id: string): Observable<TypeNoteEvaluation> { return this.httpClient.get<TypeNoteEvaluation>(`${this.SERVICE_URL}/${id}`) }
}
```

---

### Task 2: Ajouter les routes pour les nouvelles pages

**Files:**
- Modify: `src/app/features/modules/cours/cours-routing.module.ts`

- [ ] **Add imports and routes**

Ajouter les imports :
```typescript
import { NouvelleEvaluationPageComponent } from './pages/nouvelle-evaluation-page/nouvelle-evaluation-page.component';
import { SaisieNotesPageComponent } from './pages/saisie-notes-page/saisie-notes-page.component';
```

Modifier la section `notes` dans `routes` :
```typescript
  {
    path: 'notes',
    children: [
      { path: '', component: ListeNotesPageComponent, pathMatch: 'full' },
      { path: 'nouveau', component: NouvelleEvaluationPageComponent, pathMatch: 'full' },
      { path: ':id/saisie', component: SaisieNotesPageComponent, pathMatch: 'full' },
    ],
  },
```

---

### Task 3: Ajouter les boutons sur la page liste des évaluations

**Files:**
- Modify: `src/app/features/modules/cours/pages/liste-notes-page/liste-notes-page.component.html`

- [ ] **Ajouter bouton "Nouvelle évaluation" dans l'entête**

Remplacer :
```html
<div class="flex justify-between items-start gap-x-8 mb-8">
    <app-header-title title="Notes d'évaluation" subtitle="Consulter la liste des notes de vos évaluations"></app-header-title>
</div>
```
Par :
```html
<div class="flex justify-between items-start gap-x-8 mb-8">
    <app-header-title title="Notes d'évaluation" subtitle="Consulter la liste des notes de vos évaluations"></app-header-title>
    <div class="flex justify-end items-center">
        <app-custom-button *ngIf="rolesValue.isInstitution || rolesValue.isEnseignant || rolesValue.isAdmin"
                           link="/cours/notes/nouveau"
                           text="Nouvelle évaluation">
        </app-custom-button>
    </div>
</div>
```

- [ ] **Ajouter colonne Actions dans le tableau**

Après la dernière colonne `<th>` (Étudiants), ajouter :
```html
<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
```

Après la dernière colonne `<td>` (liste.notesEvaluation?.length), dans chaque ligne `<tr>`, ajouter :
```html
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
    <app-custom-button [link]="'/cours/notes/' + liste.id + '/saisie'"
                       text="Saisir"
                       color="primary"
                       outlined="true">
    </app-custom-button>
</td>
```

---

### Task 4: Créer NouvelleEvaluationPageComponent

**Files:**
- Create: `src/app/features/modules/cours/pages/nouvelle-evaluation-page/nouvelle-evaluation-page.component.ts`
- Create: `src/app/features/modules/cours/pages/nouvelle-evaluation-page/nouvelle-evaluation-page.component.html`
- Create: `src/app/features/modules/cours/pages/nouvelle-evaluation-page/nouvelle-evaluation-page.component.scss`

- [ ] **Create component TS**

```typescript
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { ListeNoteEvaluation } from 'src/app/data/modules/inscription/models/ListeNoteEvaluation.model';
import { TypeNoteEvaluation } from 'src/app/data/modules/inscription/models/TypeNoteEvaluation.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { ListeNoteEvaluationService } from 'src/app/data/modules/inscription/services/liste-note-evaluation.service';
import { TypeNoteEvaluationService } from 'src/app/data/modules/inscription/services/type-note-evaluation.service';

@Component({
    selector: 'app-nouvelle-evaluation-page',
    templateUrl: './nouvelle-evaluation-page.component.html',
    styleUrls: ['./nouvelle-evaluation-page.component.scss']
})
export class NouvelleEvaluationPageComponent extends BaseComponentClass implements OnInit {

    error: boolean = false
    cours: Cours[] = []
    typesNote: TypeNoteEvaluation[] = []

    evaluationForm: FormGroup = new FormGroup({
        coursId: new FormControl(null, [Validators.required]),
        typeNoteEvaluationId: new FormControl(null, [Validators.required]),
        date: new FormControl(null, [Validators.required]),
        heureDebut: new FormControl(null, [Validators.required]),
        heureFin: new FormControl(null, [Validators.required]),
        poidsTypeNoteEvaluation: new FormControl(null, [Validators.required]),
    })

    constructor(
        private router: Router,
        private coursService: CoursService,
        private typeNoteEvaluationService: TypeNoteEvaluationService,
        private listeNoteEvaluationService: ListeNoteEvaluationService) {
        super()
        if (!this.rolesValue.isInstitution && !this.rolesValue.isEnseignant && !this.rolesValue.isAdmin) {
            this.router.navigate(['/cours/notes'])
        }
    }

    ngOnInit(): void {
        this.coursService.getAll().subscribe({ next: (res) => { this.cours = res }, error: (err) => { console.log(err) } })
        this.typeNoteEvaluationService.getAll().subscribe({ next: (res) => { this.typesNote = res }, error: (err) => { console.log(err) } })
    }

    create(): void {
        this.evaluationForm.markAllAsTouched()
        if (this.evaluationForm.valid) {
            const liste: ListeNoteEvaluation = new ListeNoteEvaluation()
            liste.coursId = this.evaluationForm.get('coursId')!.value
            liste.typeNoteEvaluationId = this.evaluationForm.get('typeNoteEvaluationId')!.value
            liste.date = this.evaluationForm.get('date')!.value
            liste.heureDebut = this.evaluationForm.get('heureDebut')!.value
            liste.heureFin = this.evaluationForm.get('heureFin')!.value
            liste.poidsTypeNoteEvaluation = this.evaluationForm.get('poidsTypeNoteEvaluation')!.value

            this.listeNoteEvaluationService.create(liste).subscribe({
                next: (res) => {
                    this.router.navigate(['/cours/notes', res.id, 'saisie'])
                },
                error: (err: HttpErrorResponse) => {
                    console.log(err)
                    this.error = true
                    setTimeout(() => { this.error = false }, 3000)
                }
            })
        }
    }
}
```

- [ ] **Create component HTML**

```html
<app-custom-alert [show]="error" title="Erreur">
    Une erreur est survenue lors de la création
</app-custom-alert>

<app-return-back></app-return-back>

<div class="flex justify-between items-start mb-8">
    <app-header-title title="Nouvelle évaluation" subtitle="Veuillez renseigner les informations ci-dessous pour créer une nouvelle évaluation"></app-header-title>
    <div class="flex justify-end items-center">
    </div>
</div>

<div class="w-full mb-8">
    <form [formGroup]="evaluationForm" id="evaluationForm">
        <div class="grid grid-cols-6 md:gap-x-24 gap-x-0 gap-y-10 mb-8">
            <div class="md:col-span-4 col-span-full">
                <label for="coursId" class="mb-2 block text-sm leading-6 text-gray-600">Cours</label>
                <select id="coursId" formControlName="coursId"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                    <option value="" disabled>Sélectionner un cours</option>
                    <option *ngFor="let c of cours" [value]="c.id">{{ c.code }} — {{ c.intitule }}</option>
                </select>
                <div *ngIf="evaluationForm.get('coursId')!.invalid && (evaluationForm.get('coursId')!.dirty || evaluationForm.get('coursId')!.touched)">
                    <app-form-message *ngIf="evaluationForm.get('coursId')!.errors?.['required']"
                        text="Veuillez sélectionner un cours"></app-form-message>
                </div>
            </div>
            <div class="md:col-span-4 col-span-full">
                <label for="typeNoteEvaluationId" class="mb-2 block text-sm leading-6 text-gray-600">Type d'évaluation</label>
                <select id="typeNoteEvaluationId" formControlName="typeNoteEvaluationId"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                    <option value="" disabled>Sélectionner un type</option>
                    <option *ngFor="let t of typesNote" [value]="t.id">{{ t.libelle }}</option>
                </select>
                <div *ngIf="evaluationForm.get('typeNoteEvaluationId')!.invalid && (evaluationForm.get('typeNoteEvaluationId')!.dirty || evaluationForm.get('typeNoteEvaluationId')!.touched)">
                    <app-form-message *ngIf="evaluationForm.get('typeNoteEvaluationId')!.errors?.['required']"
                        text="Veuillez sélectionner un type"></app-form-message>
                </div>
            </div>
            <div class="md:col-span-4 col-span-full">
                <label for="date" class="mb-2 block text-sm leading-6 text-gray-600">Date</label>
                <input type="date" id="date" formControlName="date"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                <div *ngIf="evaluationForm.get('date')!.invalid && (evaluationForm.get('date')!.dirty || evaluationForm.get('date')!.touched)">
                    <app-form-message *ngIf="evaluationForm.get('date')!.errors?.['required']"
                        text="Veuillez saisir la date"></app-form-message>
                </div>
            </div>
            <div class="md:col-span-4 col-span-full">
                <label for="heureDebut" class="mb-2 block text-sm leading-6 text-gray-600">Heure de début</label>
                <input type="time" id="heureDebut" formControlName="heureDebut"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                <div *ngIf="evaluationForm.get('heureDebut')!.invalid && (evaluationForm.get('heureDebut')!.dirty || evaluationForm.get('heureDebut')!.touched)">
                    <app-form-message *ngIf="evaluationForm.get('heureDebut')!.errors?.['required']"
                        text="Veuillez saisir l'heure de début"></app-form-message>
                </div>
            </div>
            <div class="md:col-span-4 col-span-full">
                <label for="heureFin" class="mb-2 block text-sm leading-6 text-gray-600">Heure de fin</label>
                <input type="time" id="heureFin" formControlName="heureFin"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                <div *ngIf="evaluationForm.get('heureFin')!.invalid && (evaluationForm.get('heureFin')!.dirty || evaluationForm.get('heureFin')!.touched)">
                    <app-form-message *ngIf="evaluationForm.get('heureFin')!.errors?.['required']"
                        text="Veuillez saisir l'heure de fin"></app-form-message>
                </div>
            </div>
            <div class="md:col-span-4 col-span-full">
                <label for="poidsTypeNoteEvaluation" class="mb-2 block text-sm leading-6 text-gray-600">Poids (%)</label>
                <input type="number" id="poidsTypeNoteEvaluation" formControlName="poidsTypeNoteEvaluation" placeholder="Ex: 20"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                <div *ngIf="evaluationForm.get('poidsTypeNoteEvaluation')!.invalid && (evaluationForm.get('poidsTypeNoteEvaluation')!.dirty || evaluationForm.get('poidsTypeNoteEvaluation')!.touched)">
                    <app-form-message *ngIf="evaluationForm.get('poidsTypeNoteEvaluation')!.errors?.['required']"
                        text="Veuillez saisir le poids"></app-form-message>
                </div>
            </div>
        </div>

        <div class="w-full flex justify-end items-center pb-12">
            <app-custom-button (click)="create()" text="Créer l'évaluation"></app-custom-button>
        </div>
    </form>
</div>
```

- [ ] **Create empty SCSS**

```scss
```

---

### Task 5: Créer SaisieNotesPageComponent

**Files:**
- Create: `src/app/features/modules/cours/pages/saisie-notes-page/saisie-notes-page.component.ts`
- Create: `src/app/features/modules/cours/pages/saisie-notes-page/saisie-notes-page.component.html`
- Create: `src/app/features/modules/cours/pages/saisie-notes-page/saisie-notes-page.component.scss`

- [ ] **Create component TS**

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CoursParticipant } from 'src/app/data/modules/inscription/models/CoursParticipant.model';
import { ListeNoteEvaluation } from 'src/app/data/modules/inscription/models/ListeNoteEvaluation.model';
import { NoteEvaluation } from 'src/app/data/modules/inscription/models/NoteEvaluation.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { ListeNoteEvaluationService } from 'src/app/data/modules/inscription/services/liste-note-evaluation.service';

@Component({
    selector: 'app-saisie-notes-page',
    templateUrl: './saisie-notes-page.component.html',
    styleUrls: ['./saisie-notes-page.component.scss']
})
export class SaisieNotesPageComponent extends BaseComponentClass implements OnInit {

    evaluation: ListeNoteEvaluation | null = null
    participants: CoursParticipant[] = []
    notesMap: { [coursParticipantId: string]: NoteEvaluation } = {}
    notesInput: { [coursParticipantId: string]: number | null } = {}
    loading: boolean = true
    saving: boolean = false
    success: boolean = false
    error: boolean = false

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private listeNoteEvaluationService: ListeNoteEvaluationService,
        private coursService: CoursService) {
        super()
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id')
        if (id) {
            this.loadEvaluation(id)
        }
    }

    private loadEvaluation(id: string): void {
        this.listeNoteEvaluationService.get(id).subscribe({
            next: (res) => {
                this.evaluation = res
                this.loadParticipants(res.coursId!)
                this.initNotesMap(res.notesEvaluation || [])
            },
            error: (err) => {
                console.log(err)
                this.loading = false
            }
        })
    }

    private loadParticipants(coursId: string): void {
        this.coursService.getParticipants(coursId).subscribe({
            next: (res) => {
                this.participants = res
                this.loading = false
                this.participants.forEach(p => {
                    if (this.notesInput[p.id!] === undefined) {
                        this.notesInput[p.id!] = null
                    }
                })
            },
            error: (err) => {
                console.log(err)
                this.loading = false
            }
        })
    }

    private initNotesMap(notes: NoteEvaluation[]): void {
        notes.forEach(n => {
            this.notesMap[n.coursParticipantId!] = n
            this.notesInput[n.coursParticipantId!] = n.note ?? null
        })
    }

    save(): void {
        if (!this.evaluation) return
        this.saving = true
        this.error = false
        this.success = false

        const notesToSave: NoteEvaluation[] = this.participants.map(p => {
            const existing = this.notesMap[p.id!]
            const val = this.notesInput[p.id!]
            const note = new NoteEvaluation()
            if (existing?.id) note.id = existing.id
            note.listeNoteEvaluationId = this.evaluation!.id
            note.coursParticipantId = p.id
            note.note = val ?? undefined
            return note
        })

        this.listeNoteEvaluationService.update({
            ...this.evaluation,
            notesEvaluation: notesToSave
        }).subscribe({
            next: () => {
                this.saving = false
                this.success = true
                setTimeout(() => this.success = false, 3000)
            },
            error: (err) => {
                console.log(err)
                this.saving = false
                this.error = true
                setTimeout(() => this.error = false, 3000)
            }
        })
    }
}
```

- [ ] **Create component HTML**

```html
<app-custom-alert [show]="error" title="Erreur">
    Une erreur est survenue lors de l'enregistrement
</app-custom-alert>
<app-custom-alert [show]="success" title="Succès" color="green">
    Notes enregistrées avec succès
</app-custom-alert>

<app-return-back></app-return-back>

<div class="flex justify-between items-start mb-8">
    <app-header-title 
        [title]="'Saisie des notes — ' + (evaluation?.cours?.code || '')" 
        [subtitle]="evaluation ? (evaluation.typeNoteEvaluation?.libelle || '') + ' — ' + (evaluation.date | date:'dd MMMM YYYY') : ''">
    </app-header-title>
    <div class="flex justify-end items-center">
    </div>
</div>

<div *ngIf="loading" class="w-full py-24 flex justify-center">
    <div class="text-sm text-gray-500">Chargement...</div>
</div>

<div *ngIf="!loading && participants.length === 0" class="w-full py-24 flex justify-center">
    <div class="text-sm text-gray-500">Aucun étudiant inscrit à ce cours</div>
</div>

<div *ngIf="!loading && participants.length > 0" class="w-full overflow-x-auto bg-white shadow-sm rounded-lg">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Étudiant</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note /20</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let p of participants; index as i" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ i + 1 }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ p.utilisateur?.nom }} {{ p.utilisateur?.prenoms }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <input type="number" [(ngModel)]="notesInput[p.id!]" min="0" max="20" step="0.5"
                        placeholder="Note"
                        class="w-24 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span *ngIf="notesInput[p.id!] !== null && notesInput[p.id!] !== undefined" class="text-green-600 font-medium">Noté</span>
                    <span *ngIf="notesInput[p.id!] === null || notesInput[p.id!] === undefined" class="text-gray-400">En attente</span>
                </td>
            </tr>
        </tbody>
    </table>

    <div class="px-6 py-4 flex justify-end">
        <app-custom-button (click)="save()" [disabled]="saving" [text]="saving ? 'Enregistrement...' : 'Enregistrer les notes'">
        </app-custom-button>
    </div>
</div>
```

- [ ] **Create empty SCSS**

```scss
```

---

### Task 6: Enregistrer les nouveaux composants dans le module

**Files:**
- Modify: `src/app/features/modules/cours/cours.module.ts`

- [ ] **Add imports and declarations**

Ajouter les imports :
```typescript
import { NouvelleEvaluationPageComponent } from './pages/nouvelle-evaluation-page/nouvelle-evaluation-page.component';
import { SaisieNotesPageComponent } from './pages/saisie-notes-page/saisie-notes-page.component';
```

Ajouter aux `declarations` :
```typescript
    NouvelleEvaluationPageComponent,
    SaisieNotesPageComponent,
```

---

### Task 7: Vérifier la compilation

- [ ] **Lancer la compilation**

```bash
cd E:\EASYECOLE\easy-ecole-web
ng build 2>&1 | Select-String -Pattern "error"
```

Expected: No errors related to the new components.
