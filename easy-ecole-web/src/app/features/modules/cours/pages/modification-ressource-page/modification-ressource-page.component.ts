import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TypesMedia } from 'src/app/data/enums/TypesMedia';
import { TypesRessource } from 'src/app/data/enums/TypesRessource';
import { FichierRessource } from 'src/app/data/modules/inscription/models/FichierRessource.model';
import { Ressource } from 'src/app/data/modules/inscription/models/Ressource.model';
import { FichierRessourceService } from 'src/app/data/modules/inscription/services/fichier-ressource.service';
import { RessourceService } from 'src/app/data/modules/inscription/services/ressource.service';
import { FichierRessourceType } from 'src/app/data/types/FichierRessourceType';

import 'quill-emoji/dist/quill-emoji.js'
import { getClassWithColor } from 'file-icons-js';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-modification-ressource-page',
  templateUrl: './modification-ressource-page.component.html',
  styleUrls: ['./modification-ressource-page.component.scss']
})
export class ModificationRessourcePageComponent extends BaseComponentClass implements OnInit {

  disableButton: boolean = false
  alreadyExists: boolean = false
  error: boolean = false

  coursId!: string
  chapitreId!: string
  ressourceId!: string
  ressource?: Ressource

  readonly typesMedia = TypesMedia

  fichiersRessource: (FichierRessource | FichierRessourceType)[] = [
    // {fichier: 2, titre: "Exemple de fichier", description: "Ceci est la description de ce fichier"}
  ]
  fichiersRessourceProgressInfos: any[] = []

  modificationRessourceForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    dateDebut: new FormControl(null, []),
    dateFin: new FormControl(null, []),
    echeance: new FormControl(null, []),
    description: new FormControl(null, []),
  })

  // Modals
  showFichierRessourceModal: boolean = false
  showProgressInfoModal: boolean = false

  constructor(
    private ressourceService: RessourceService,
    private fichierRessourceService: FichierRessourceService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    if (!this.rolesValue.isEnseignant) {
      this.router.navigate(['/cours/cours'])
    }
    else {
      this.coursId = this.activatedRoute.snapshot.paramMap.get("id") as string
      this.chapitreId = this.activatedRoute.snapshot.paramMap.get("chapitre") as string
      this.ressourceId = this.activatedRoute.snapshot.paramMap.get("ressource") as string
      this.getRessource()
    }
  }

  ngOnInit(): void { }

  getRessource(): void {
    this.ressourceService.get(this.ressourceId)
      .subscribe(
        {
          next: (res) => {
            this.ressource = res

            this.modificationRessourceForm.get('titre')?.setValue(this.ressource.titre)
            this.modificationRessourceForm.get('description')?.setValue(this.ressource.description)
            this.fichiersRessource = this.ressource.fichiersRessource as FichierRessource[] ?? []
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404 || err.status == 403) {
              this.router.navigate(['/cours/cours/' + this.coursId + '/chapitres/' + this.chapitreId])
            }
          },
        }
      )
  }

  getFichierRessourceIcone(nomFichier: string): string {
    return getClassWithColor(nomFichier)
  }

  ajouterFichierRessource(fichierRessource: FichierRessourceType): void {
    this.fichiersRessource.push(fichierRessource)
    console.log(this.fichiersRessource)
  }

  retirerFichierRessource(i: number): void {
    let fichierRessource: FichierRessource = this.fichiersRessource[i]

    if (typeof fichierRessource === 'object') {
      if ('id' in fichierRessource) {
        let confirmationSuppressionFichierRessource: boolean = window.confirm("Êtes-vous vraiment sûr de vouloir supprimer définitivement ce fichier ? Vous ne pourrez plus revenir en arrière")
        if (confirmationSuppressionFichierRessource) {
          this.fichierRessourceService.delete(fichierRessource.id!).subscribe({
            next: (res) => {
              this.fichiersRessource = this.fichiersRessource.filter((value, index) => index != i)
            },
            error: (err: HttpErrorResponse) => {
              console.log(err)
            },
          })
        }
      }
      else {
        this.fichiersRessource = this.fichiersRessource.filter((value, index) => index != i)
      }
    }
  }

  modifierRessource(): void {
    this.modificationRessourceForm.markAllAsTouched()

    if (this.modificationRessourceForm.valid) {
      let ressource: Ressource = new Ressource()
      ressource.id = this.ressourceId
      ressource.titre = this.modificationRessourceForm.get('titre')!.value
      ressource.description = this.modificationRessourceForm.get('description')!.value
      // ressource.dateDebut = this.modificationRessourceForm.get('dateDebut')!.value
      // ressource.dateFin = this.modificationRessourceForm.get('dateFin')!.value
      ressource.active = false
      ressource.chapitreCoursId = this.chapitreId

      this.ressourceService.update(ressource)
        .subscribe(
          {
            next: (res) => {
              if (this.fichiersRessource.length != 0) {
                this.showProgressInfoModal = true
                this.uploaderFichiersRessource(res.id)
              }
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
            },
          }
        )
    }
    else {
      console.log('Error')
    }
  }

  uploaderFichiersRessource(ressourceId): void {
    this.fichiersRessource = this.fichiersRessource.filter((value) => (typeof value === 'object') && !('id' in value));

    (this.fichiersRessource as FichierRessourceType[]).forEach((element: FichierRessourceType, index: number) => {
      this.fichiersRessourceProgressInfos[index] = { value: 0, error: false }

      let fichierRessource: FichierRessource = new FichierRessource()
      fichierRessource.ressourceId = ressourceId
      fichierRessource.titre = element.titre
      fichierRessource.description = element.description
      if (element.fichier) {
        fichierRessource.fichier = element.fichier.filename ?? element.fichier
      }

      this.fichierRessourceService.create(fichierRessource, (element.fichier && element.fichier.filename) ? element.fichier : undefined).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.fichiersRessourceProgressInfos[index].value = Math.round(100 * event.loaded / event.total)
          } else if (event instanceof HttpResponse) {
            console.log("Success")
            this.fichiersRessourceProgressInfos[index].error = false
          }
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          this.fichiersRessourceProgressInfos[index].error = true
          this.fichiersRessourceProgressInfos[index].value = 0
        }
      })
    })
  }

  closeProgressInfoModal(): void {
    this.showProgressInfoModal = false
    this.router.navigate(['/cours/cours/' + this.coursId + '/chapitres/' + this.chapitreId])
  }


  // Quill
  focused = false
  modules = {
    'emoji-shortname': true,
    'emoji-textarea': false,
    'emoji-toolbar': true,
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
        ['link'],
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

}
