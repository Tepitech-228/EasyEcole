import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { TypesMedia } from 'src/app/data/enums/TypesMedia';
import { ChapitreCours } from 'src/app/data/modules/inscription/models/ChapitreCours.model';
import { ChapitreCoursService } from 'src/app/data/modules/inscription/services/chapitre-cours.service';

import 'quill-emoji/dist/quill-emoji.js'
import Quill from 'quill'
import ImageResize from 'quill-image-resize-module'
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';

Quill.register('modules/imageResize', ImageResize);

@Component({
  selector: 'app-nouveau-chapitre-page',
  templateUrl: './nouveau-chapitre-page.component.html',
  styleUrls: ['./nouveau-chapitre-page.component.scss']
})
export class NouveauChapitrePageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  disableButton: boolean = false
  alreadyExists: boolean = false

  id!: string
  cours?: Cours
  readonly typesMedia = TypesMedia

  nouveauChapitreForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
    image: new FormControl(null, []),
  })

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private coursService: CoursService,
    private chapitreCoursService: ChapitreCoursService  ) {
    super()
    if (!this.rolesValue.isEnseignant) {
      this.router.navigate(['/cours/cours'])
    }
    else {
      this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
      this.getCours()
    }
  }

  ngOnInit(): void {
  }

  getCours(): void {
    this.coursService.get(this.id)
      .subscribe(
        {
          next: (res) => {
            this.cours = res
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404 || err.status == 403) {
              this.router.navigate(['/cours/cours'])
            }
          },
        }
      )
  }
  
  onImageChange(event: File | null): void {
    console.log(event)
    this.nouveauChapitreForm.get('image')?.setValue(event)
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
  ajouterChapitre(): void {
    this.nouveauChapitreForm.markAllAsTouched()
    console.log(this.nouveauChapitreForm.value, this.nouveauChapitreForm.get('image')?.value);

    if (this.nouveauChapitreForm.valid) {
      let chapitre: ChapitreCours = new ChapitreCours()
      chapitre.titre = this.nouveauChapitreForm.get('titre')!.value
      chapitre.description = this.nouveauChapitreForm.get('description')!.value
      chapitre.coursId = this.id

      this.chapitreCoursService.create(chapitre, this.nouveauChapitreForm.get('image')?.value)
        .subscribe(
          {
            next: (res) => {
              let chapitreCoursId = res.id
              // this.router.navigate(['/cours/cours/' + this.id])
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
              this.router.navigateByUrl("/cours/cours/"  + this.id)
            },
          }
        )
    }
    else {
      console.log('Error')
    }
  }

}
