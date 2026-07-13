import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { BlocCahierDeTexte } from 'src/app/data/modules/inscription/models/BlocCahierDeTexte.model';
import { CahierDeTexte } from 'src/app/data/modules/inscription/models/CahierDeTexte.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { BlocCahierDeTexteService } from 'src/app/data/modules/inscription/services/bloc-cahier-de-texte.service';
import { CahierDeTexteService } from 'src/app/data/modules/inscription/services/cahier-de-texte.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import 'quill-emoji/dist/quill-emoji.js'

import Quill from 'quill'
import ImageResize from 'quill-image-resize-module'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-details-cahier-de-texte-page',
  templateUrl: './details-cahier-de-texte-page.component.html',
  styleUrls: ['./details-cahier-de-texte-page.component.scss']
})
export class DetailsCahierDeTextePageComponent extends BaseComponentClass implements OnInit {

  alreadyExists: boolean = false
  error: boolean = false

  id: string
  cahierDeTexte?: CahierDeTexte

  blocsCahierDeTexte: BlocCahierDeTexte[] = []
  selectedBlocCahierDeTexte?: BlocCahierDeTexte

  cours: Cours[] = []
  coursLoading: boolean = false
  enseignants: Enseignant[] = []
  enseignantsLoading: boolean = false

  showNouveauBlocCahierDeTexteModal: boolean = false
  showModificationBlocCahierDeTexteModal: boolean = false
  showSuppressionBlocCahierDeTexteModal: boolean = false

  nouveauBlocCahierDeTexteForm: FormGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    contenu: new FormControl(null, [Validators.required]),
  })

  modificationBlocCahierDeTexteForm: FormGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    heureDebut: new FormControl(null, [Validators.required]),
    heureFin: new FormControl(null, [Validators.required]),
    contenu: new FormControl(null, [Validators.required]),
  })

  constructor(
    private sanitizer: DomSanitizer,
    private coursService: CoursService,
    private enseignantService: EnseignantService,
    private cahierDeTexteService: CahierDeTexteService,
    private blocCahierDeTexteService: BlocCahierDeTexteService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getCahierDeTexte()
  }

  ngOnInit(): void {
  }

  getCahierDeTexte(): void {
    this.cahierDeTexteService.get(this.id)
      .subscribe(
        {
          next: (res) => {
            this.cahierDeTexte = res
            this.blocsCahierDeTexte = this.cahierDeTexte.blocsCahierDeTexte ?? []
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404 || err.status == 403) {
              this.router.navigate(['/cours/cahiers-de-texte'])
            }
          },
        }
      )
  }
  
  getCours(): void {
    this.coursLoading = true

    this.coursService.getAll()
      .subscribe({
        next: (res) => {
          this.cours = res
        },
        error: (err) => {
          console.log(err)
        },
        complete: () => {
          this.coursLoading = false
        }
      })
  }

  getEnseignants(): void {
    this.enseignantsLoading = true

    this.enseignantService.getAll()
      .subscribe({
        next: (res) => {
          this.enseignants = res
        },
        error: (err) => {
          console.log(err)
        },
        complete: () => {
          this.enseignantsLoading = false
        }
      })
  }

  customCoursSearchFn(term: string, item: Cours) {
    term = term.toLowerCase();
    return item.intitule!.toLowerCase().indexOf(term) > -1 || item.code!.toLowerCase().indexOf(term) > -1;
  }

  customEnseignantSearchFn(term: string, item: Enseignant) {
    term = term.toLowerCase();
    return item.utilisateur!.nom!.toLowerCase().indexOf(term) > -1 || item.utilisateur!.prenoms!.toLowerCase().indexOf(term) > -1;
  }

  onCoursChange(event: Cours, modification: boolean = false): void {
    // console.log(event)
    if (event) {
      // this.getParticipants(event.id!)
    }
  }

  getContenu(contenu?: string): SafeHtml | null {
    if (contenu) {
      return this.sanitizer.bypassSecurityTrustHtml(contenu)
    }

    return null
  }

  ajouterBlocCahierDeTexte(): void {
    console.log(this.nouveauBlocCahierDeTexteForm.valid, this.nouveauBlocCahierDeTexteForm.value)
    this.nouveauBlocCahierDeTexteForm.markAllAsTouched()
    if (this.nouveauBlocCahierDeTexteForm.valid) {
      let blocCahierDeTexte: BlocCahierDeTexte = new BlocCahierDeTexte()
      blocCahierDeTexte.date = this.nouveauBlocCahierDeTexteForm.get('date')!.value
      blocCahierDeTexte.heureDebut = this.nouveauBlocCahierDeTexteForm.get('heureDebut')!.value
      blocCahierDeTexte.heureFin = this.nouveauBlocCahierDeTexteForm.get('heureFin')!.value
      blocCahierDeTexte.contenu = this.nouveauBlocCahierDeTexteForm.get('contenu')!.value
      blocCahierDeTexte.cahierDeTexteId = this.id

      this.blocCahierDeTexteService.create(blocCahierDeTexte).subscribe({
        next: (res) => {
          this.getCahierDeTexte()
          this.closeNouveauBlocCahierDeTexteModal()
        },
        error: (err) => {
          console.log(err)
          this.alreadyExists = err.error.alreadyExists
          if (!this.alreadyExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.alreadyExists = false
          }, 3000)
        }
      })
    }
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

  // Modals
  openNouveauBlocCahierDeTexteModal(): void {
    this.getCours()
    this.getEnseignants()

    this.showNouveauBlocCahierDeTexteModal = true
  }

  closeNouveauBlocCahierDeTexteModal(): void {
    this.showNouveauBlocCahierDeTexteModal = false
    this.nouveauBlocCahierDeTexteForm.reset()
  }

  openModificationBlocCahierDeTexteModal(arg: any): void {
    console.log(arg);
    const blocCahierDeTexteIndex = arg.event.extendedProps.index
    this.selectedBlocCahierDeTexte = this.blocsCahierDeTexte[blocCahierDeTexteIndex]

    if (this.selectedBlocCahierDeTexte) {
      this.modificationBlocCahierDeTexteForm.get('date')!.setValue(this.selectedBlocCahierDeTexte.date)
      this.modificationBlocCahierDeTexteForm.get('heureDebut')!.setValue(this.selectedBlocCahierDeTexte.heureDebut)
      this.modificationBlocCahierDeTexteForm.get('heureFin')!.setValue(this.selectedBlocCahierDeTexte.heureFin)
      this.modificationBlocCahierDeTexteForm.get('contenu')!.setValue(this.selectedBlocCahierDeTexte.contenu)

      this.showModificationBlocCahierDeTexteModal = true
    }
  }

  closeModificationBlocCahierDeTexteModal(): void {
    this.modificationBlocCahierDeTexteForm.reset()
    this.showModificationBlocCahierDeTexteModal = false
  }

  openSuppressionBlocCahierDeTexteModal(arg: any): void {
    console.log(arg);
    const blocCahierDeTexteIndex = arg.event.extendedProps.index
    this.selectedBlocCahierDeTexte = this.blocsCahierDeTexte[blocCahierDeTexteIndex]

    if (this.selectedBlocCahierDeTexte) {
      this.showSuppressionBlocCahierDeTexteModal = true
    }
  }

  closeSuppressionBlocCahierDeTexteModal(): void {
    this.showSuppressionBlocCahierDeTexteModal = false
  }

}
