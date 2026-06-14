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
import { HttpErrorResponse } from '@angular/common/http';

Quill.register('modules/imageResize', ImageResize);

@Component({
  selector: 'app-modification-chapitre-page',
  templateUrl: './modification-chapitre-page.component.html',
  styleUrls: ['./modification-chapitre-page.component.scss']
})
export class ModificationChapitrePageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  disableButton: boolean = false
  alreadyExists: boolean = false

  id!: string
  chapitreId!: string
  chapitreCours?: ChapitreCours
  readonly typesMedia = TypesMedia

  modificationChapitreForm: FormGroup = new FormGroup({
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
      this.chapitreId = this.activatedRoute.snapshot.paramMap.get("chapitre") as string
      this.getChapitreCours()
    }
  }

  ngOnInit(): void {
  }

  getChapitreCours(): void {
    this.chapitreCoursService.get(this.chapitreId)
      .subscribe(
        {
          next: (res) => {
            this.chapitreCours = res

            this.modificationChapitreForm.get('titre')?.setValue(this.chapitreCours.titre)
            this.modificationChapitreForm.get('description')?.setValue(this.chapitreCours.description)
            this.modificationChapitreForm.get('image')?.setValue(this.chapitreCours.image)
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
    this.modificationChapitreForm.get('image')?.setValue(event)
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
  modifierChapitre(): void {
    this.modificationChapitreForm.markAllAsTouched()
    console.log(this.modificationChapitreForm.value, this.modificationChapitreForm.get('image')?.value);

    if (this.modificationChapitreForm.valid) {
      let chapitre: ChapitreCours = new ChapitreCours()
      chapitre.id = this.chapitreId
      chapitre.titre = this.modificationChapitreForm.get('titre')!.value
      chapitre.description = this.modificationChapitreForm.get('description')!.value
      // chapitre.coursId = this.id

      this.chapitreCoursService.update(chapitre, this.modificationChapitreForm.get('image')?.value)
        .subscribe(
          {
            next: (res) => {
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
              this.router.navigateByUrl("/cours/cours/" + this.id)
            },
          }
        )
    }
    else {
      console.log('Error')
    }
  }

}
