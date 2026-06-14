import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TypesRessource } from 'src/app/data/enums/TypesRessource';

import 'quill-emoji/dist/quill-emoji.js'
import { Ressource } from 'src/app/data/modules/inscription/models/Ressource.model';
import { RessourceService } from 'src/app/data/modules/inscription/services/ressource.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TypesMedia } from 'src/app/data/enums/TypesMedia';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { FichierRessourceType } from 'src/app/data/types/FichierRessourceType';
import { FichierRessource } from 'src/app/data/modules/inscription/models/FichierRessource.model';
import { FichierRessourceService } from 'src/app/data/modules/inscription/services/fichier-ressource.service';
import { getClassWithColor } from 'file-icons-js';

@Component({
  selector: 'app-nouvelle-ressource-page',
  templateUrl: './nouvelle-ressource-page.component.html',
  styleUrls: ['./nouvelle-ressource-page.component.scss']
})
export class NouvelleRessourcePageComponent implements OnInit {

  disableButton: boolean = false
  alreadyExists: boolean = false
  error: boolean = false

  coursId: string
  chapitreId: string
  typeRessource?: TypesRessource
  readonly typesMedia = TypesMedia
  readonly typesRessource = TypesRessource

  fichiersRessource: FichierRessourceType[] = [
    // {fichier: 2, titre: "Exemple de fichier", description: "Ceci est la description de ce fichier"}
  ]
  fichiersRessourceProgressInfos: any[] = []

  nouvelleRessourceForm: FormGroup = new FormGroup({
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
    this.coursId = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.chapitreId = this.activatedRoute.snapshot.paramMap.get("chapitre") as string
    this.typeRessource = this.activatedRoute.snapshot.queryParamMap.get('type') as TypesRessource ?? TypesRessource.NORMALE
  }

  ngOnInit(): void { }

  getFichierRessourceIcone(nomFichier: string): string {
    return getClassWithColor(nomFichier)
  }

  ajouterFichierRessource(fichierRessource: FichierRessourceType): void {
    this.fichiersRessource.push(fichierRessource)
    console.log(this.fichiersRessource)
  }

  retirerFichierRessource(i: number): void {
    this.fichiersRessource = this.fichiersRessource.filter((value, index) => index != i)
  }

  ajouterRessource(): void {
    this.nouvelleRessourceForm.markAllAsTouched()

    if (this.nouvelleRessourceForm.valid) {
      let ressource: Ressource = new Ressource()
      ressource.titre = this.nouvelleRessourceForm.get('titre')!.value
      ressource.description = this.nouvelleRessourceForm.get('description')!.value
      // ressource.dateDebut = this.nouvelleRessourceForm.get('dateDebut')!.value
      // ressource.dateFin = this.nouvelleRessourceForm.get('dateFin')!.value
      ressource.active = false
      ressource.type = this.typeRessource
      ressource.chapitreCoursId = this.chapitreId

      this.ressourceService.create(ressource)
        .subscribe(
          {
            next: (res) => {
              if(this.fichiersRessource.length != 0) {
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
    this.fichiersRessource.forEach((element: FichierRessourceType, index: number) => {
      this.fichiersRessourceProgressInfos[index] = { value: 0, error: false }

      let fichierRessource: FichierRessource = new FichierRessource()
      fichierRessource.ressourceId = ressourceId
      fichierRessource.titre = element.titre
      fichierRessource.description = element.description
      if(element.fichier) {
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
