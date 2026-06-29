import { Component, OnInit } from '@angular/core';
import 'quill-emoji/dist/quill-emoji.js'

import Quill from 'quill'
import ImageResize from 'quill-image-resize-module'
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatierePrerequis } from 'src/app/data/modules/orientation/models/MatierePrerequis.model';
import { MatierePrerequisService } from 'src/app/data/modules/orientation/services/matiere-prerequis.service';
import { NiveauEtude } from 'src/app/data/modules/orientation/models/NiveauEtude.model';
import { NiveauEtudeService } from 'src/app/data/modules/orientation/services/niveau-etude.service';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { CategorieService } from 'src/app/data/modules/orientation/services/categorie.service';
import { ParcoursService } from 'src/app/data/modules/orientation/services/parcours.service';
import { DeboucheParcours } from 'src/app/data/modules/orientation/models/DeboucheParcours.model';
import { PrerequisParcours } from 'src/app/data/modules/orientation/models/PrerequisParcours.model';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { Categorie } from 'src/app/data/modules/orientation/models/Categorie.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DeboucheParcoursService } from 'src/app/data/modules/orientation/services/debouche-parcours.service';
import { PrerequisParcoursService } from 'src/app/data/modules/orientation/services/prerequis-parcours.service';
import { TypesMedia } from 'src/app/data/enums/TypesMedia';
import { COLUMNS_SCHEMA, PrerequisParcoursType } from 'src/app/data/types/PrerequisParcoursType';
import { DeboucheParcoursType } from 'src/app/data/types/DeboucheParcoursType';

Quill.register('modules/imageResize', ImageResize);

@Component({
  selector: 'app-nouveau-parcours-page',
  templateUrl: './nouveau-parcours-page.component.html',
  styleUrls: ['./nouveau-parcours-page.component.scss']
})
export class NouveauParcoursPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  disableButton: boolean = false
  alreadyExists: boolean = false

  columnsSchema: any = COLUMNS_SCHEMA;
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation
  readonly typesMedia = TypesMedia

  niveauxEtude: NiveauEtude[] = []
  matieres: MatierePrerequis[] = []
  categories: Categorie[] = []

  nouveauParcoursForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    duree: new FormControl(0, [Validators.required]),
    dureeUnite: new FormControl('y', [Validators.required]),
    niveauEtude: new FormControl(null, [Validators.required]),
    categorie: new FormControl(null, []),
    image: new FormControl(null, []),
    video: new FormControl(null, []),
    contenu: new FormControl(null, [Validators.required]),
  })
  debouchesParcours: DeboucheParcoursType[] = []
  prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []

  // Modals
  showPrerequisModal: boolean = false
  showDebouchesModal: boolean = false

  constructor(
    private router: Router,
    private matierePrerequisService: MatierePrerequisService,
    private niveauEtudeService: NiveauEtudeService,
    private categorieService: CategorieService,
    private parcoursService: ParcoursService,
    private prerequisParcoursService: PrerequisParcoursService,
    private deboucheParcoursService: DeboucheParcoursService,
  ) {
    super()
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
      this.router.navigate(['/orientation/parcours'])
    }
    else {
      this.getCategories()
      this.getNiveauxEtude()
      this.getMatieresPrerequis()
    }
  }

  private getCategories(): void {
    this.categorieService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.categories = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  private getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.niveauxEtude = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  private getMatieresPrerequis(): void {
    this.matierePrerequisService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.matieres = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  ngOnInit(): void {
  }

  onImageChange(event: File | null): void {
    console.log(event)
    this.nouveauParcoursForm.get('image')?.setValue(event)
  }

  onVideoChange(event: File | null): void {
    console.log(event)
    this.nouveauParcoursForm.get('video')?.setValue(event)
  }

  ajouterDebouche(deboucheParcours: DeboucheParcoursType): void {
    this.debouchesParcours.push(deboucheParcours)
    console.log(this.debouchesParcours)
  }

  retirerDebouche(i: number): void {
    this.debouchesParcours = this.debouchesParcours.filter((value, index) => index != i)
  }

  ajouterPrerequis(prerequisParcours: any): void {
    this.prerequisParcours.push(prerequisParcours)
    console.log(this.prerequisParcours)
  }

  retirerPrerequis(i: number): void {
    this.prerequisParcours = this.prerequisParcours.filter((value, index) => index != i)
  }

  // Quill
  focused = false
  modules = {
    'emoji-shortname': true,
    'emoji-textarea': false,
    'emoji-toolbar': true,
    imageResize: {
      displaySize: true
    },
    'toolbar': {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],

        // [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],

        // [{ 'size': ['small', false, 'large', 'huge'] }],
        // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],

        ['clean'],

        // ['link', 'image', 'video'],
        ['link', 'video'],
        ['emoji'],
      ],
      handlers: { 'emoji': function () { } }
    }
  }

  focus($event: any) {
    this.focused = true
  }

  blur($event: any) {
    this.focused = false
  }

  // 
  create(): void {
    this.nouveauParcoursForm.markAllAsTouched()
    console.log(this.nouveauParcoursForm.value);

    if (this.nouveauParcoursForm.valid) {
      let parcours: Parcours = new Parcours()
      parcours.titre = this.nouveauParcoursForm.get('titre')!.value
      parcours.dureeDeFormation = this.nouveauParcoursForm.get('duree')!.value + '/' + this.nouveauParcoursForm.get('dureeUnite')!.value
      parcours.niveauEtudeId = this.nouveauParcoursForm.get('niveauEtude')!.value
      parcours.categorieId = this.nouveauParcoursForm.get('categorie')!.value
      parcours.contenu = this.nouveauParcoursForm.get('contenu')!.value

      this.parcoursService.create(parcours, this.nouveauParcoursForm.get('image')?.value, this.nouveauParcoursForm.get('video')?.value)
        .subscribe(
          {
            next: (res) => {
              let parcoursId = res.id
              this.prerequisParcours.forEach((element) => {
                const niveauEtudeId: string = element[0].id as string

                element[1].forEach(value => {
                  let prerequis: PrerequisParcours = new PrerequisParcours()
                  prerequis.parcoursId = parcoursId
                  prerequis.matierePrerequisId = value.matiere
                  prerequis.niveauEtudeId = niveauEtudeId
                  prerequis.typeEvaluation = value.evaluation
                  prerequis.periodeEvaluation = value.periode
                  prerequis.noteRequise = value.note

                  this.prerequisParcoursService.create(prerequis).subscribe({
                    next: (res) => {
                      console.log("Success")
                    },
                    error: (err: HttpErrorResponse) => {
                      console.log(err)
                    }
                  })
                })
              })

              this.debouchesParcours.forEach((element: DeboucheParcoursType) => {
                let deboucheParcours: DeboucheParcours = new DeboucheParcours()
                deboucheParcours.parcoursId = parcoursId
                deboucheParcours.titre = element.titre
                deboucheParcours.description = element.description
                if(element.video) {
                  deboucheParcours.video = element.video.filename ?? element.video
                }

                this.deboucheParcoursService.create(deboucheParcours, (element.video && element.video.filename) ? element.video : undefined).subscribe({
                  next: (res) => {
                    console.log("Success")
                  },
                  error: (err: HttpErrorResponse) => {
                    console.log(err)
                  }
                })
              })
            },
            error: (err: HttpErrorResponse) => {
              console.log(err)
              this.alreadyExists = err.error.alreadyExists
              if (!this.alreadyExists) {
                this.error = true
              }

              setTimeout(() => {
                this.error = false
                this.alreadyExists = false
              }, 3000)
            },
            complete: () => {
              this.disableButton = false
              console.log("Finished")
              this.router.navigateByUrl("/orientation/parcours")
            },
          }
        )
    }
    else {
      Object.keys(this.nouveauParcoursForm.controls).forEach(key => {
        const control = this.nouveauParcoursForm.get(key);
        if (control?.invalid) {
          console.log('Champ invalide:', key, control.errors);
        }
      });
    }
  }

}
