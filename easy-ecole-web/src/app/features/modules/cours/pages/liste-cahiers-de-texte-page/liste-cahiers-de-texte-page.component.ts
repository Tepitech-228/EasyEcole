import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { CahierDeTexte } from 'src/app/data/modules/inscription/models/CahierDeTexte.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { CahierDeTexteService } from 'src/app/data/modules/inscription/services/cahier-de-texte.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';

@Component({
  selector: 'app-liste-cahiers-de-texte-page',
  templateUrl: './liste-cahiers-de-texte-page.component.html',
  styleUrls: ['./liste-cahiers-de-texte-page.component.scss']
})
export class ListeCahiersDeTextePageComponent extends BaseComponentClass implements OnInit {

  alreadyExists: boolean = false
  error: boolean = false

  // cursusApprenant?: CursusApprenant
  cahiersDeTexte: CahierDeTexte[] = []
  _cahiersDeTexte: CahierDeTexte[] = []

  niveauxEtude: NiveauEtude[] = []
  _niveauxEtude: NiveauEtude[] = []
  classes: Classe[] = []
  _classes: Classe[] = []
  parcours: Parcours[] = []
  _parcours: Parcours[] = []

  selectedNiveauEtude: string = 'undefined'
  selectedClasse: string = 'undefined'
  selectedParcours: string = 'undefined'

  searchCahierDeTexte?: string

  showNouveauCahierDeTexteModal: boolean = false

  cours: Cours[] = []
  coursLoading: boolean = false
  enseignants: Enseignant[] = []
  enseignantsLoading: boolean = false

  nouveauCahierDeTexteForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    cours: new FormControl(null, []),
    description: new FormControl(null, []),
    enseignant: new FormControl(null, []),
    choisirParmiLesCours: new FormControl(true, [Validators.required]),
  })

  constructor(
    private niveauEtudeService: NiveauEtudeService,
    private coursService: CoursService,
    private classeService: ClasseService,
    private cursusApprenantService: CursusApprenantService,
    private parcoursService: ParcoursService,
    private cahierDeTexteService: CahierDeTexteService,
    private enseignantService: EnseignantService,
  ) {
    super()
    this.getNiveauxEtude()
    this.getClasses()
    this.getParcours()

    // if (this.rolesValue.isApprenant) {
    //   this.getCoursChoisis()
    // }
    // else {
    this.getcahiersDeTexte()
    // }
  }

  ngOnInit(): void {
  }

  filtrerCahiersDeTexte(): void {
    // console.log(this.selectedNiveauEtude, this.selectedClasse, this.selectedParcours)

    this._niveauxEtude = this.niveauxEtude.filter((value: NiveauEtude) => {
      return this.selectedNiveauEtude == 'undefined' || value.id == this.selectedNiveauEtude
    })
    this._classes = this.classes.filter((value: Classe) => {
      return this.selectedNiveauEtude == 'undefined' || value.niveauEtudeId == this.selectedNiveauEtude
    })
    this._parcours = this.parcours.filter((value: Parcours) => {
      return this.selectedNiveauEtude == 'undefined' || value.niveauEtudeId == this.selectedNiveauEtude
    })

    this._cahiersDeTexte = this.cahiersDeTexte.filter((value: CahierDeTexte) => {
      return (this.selectedNiveauEtude == 'undefined' || value.cours?.parcours?.niveauEtudeId == this.selectedNiveauEtude) &&
        (this.selectedClasse == 'undefined' || value.cours?.classeId == this.selectedClasse) &&
        (this.selectedParcours == 'undefined' || value.cours?.parcoursId == this.selectedParcours)
    })
  }

  supprimerFiltres(): void {
    this.searchCahierDeTexte = undefined

    this.selectedNiveauEtude = 'undefined'
    this.selectedClasse = 'undefined'
    this.selectedParcours = 'undefined'
    this.filtrerCahiersDeTexte()
  }

  rechercherCahierDeTexte(): void {
    if (this.searchCahierDeTexte == undefined || this.searchCahierDeTexte == '') {
      this._cahiersDeTexte = this.cahiersDeTexte
    }
    else {
      this._cahiersDeTexte = this.cahiersDeTexte.filter((value: CahierDeTexte) => {
        console.log(value.titre!.toLowerCase().includes(this.searchCahierDeTexte!.toLowerCase()))
        return value.titre!.toLowerCase().includes(this.searchCahierDeTexte!.toLowerCase()) || value.description?.toLowerCase().includes(this.searchCahierDeTexte!.toLowerCase())
      })
    }
  }

  // getCoursChoisis(): void {
  //   this.cursusApprenantService.getCoursChoisis()
  //     .subscribe(
  //       {
  //         next: (res) => {
  //           this.cursusApprenant = res

  //           if (this.cursusApprenant != null) {
  //             this.cours = this.cursusApprenant.demandeInscription?.cours ?? []
  //             this.filtrerCours()
  //           }
  //         },
  //         error: (err) => {
  //           console.log(err)
  //         },
  //       }
  //     )
  // }

  getcahiersDeTexte(): void {
    this.cahierDeTexteService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.cahiersDeTexte = res
            this.filtrerCahiersDeTexte()
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.niveauxEtude = res
            this._niveauxEtude = this.niveauxEtude
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getClasses(): void {
    this.classeService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.classes = res
            this._classes = this.classes
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  getParcours(): void {
    this.parcoursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this._parcours = this.parcours
          },
          error: (err) => {
            console.log(err)
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

  onCoursChange(event: Cours): void {
    // console.log(event)
    if (event) {
      this.nouveauCahierDeTexteForm.get('titre')!.setValue(event.code)
      this.nouveauCahierDeTexteForm.get('description')!.setValue(event.intitule)
      this.nouveauCahierDeTexteForm.get('enseignant')!.setValue(event.enseignantId)
    }
  }

  ajouterCahierDeTexte(): void {
    console.log(this.nouveauCahierDeTexteForm.valid, this.nouveauCahierDeTexteForm.value)
    this.nouveauCahierDeTexteForm.markAllAsTouched()
    if (this.nouveauCahierDeTexteForm.valid) {
      let cahierDeTexte: CahierDeTexte = new CahierDeTexte()
      cahierDeTexte.titre = this.nouveauCahierDeTexteForm.get('titre')!.value
      cahierDeTexte.description = this.nouveauCahierDeTexteForm.get('description')!.value
      cahierDeTexte.coursId = this.nouveauCahierDeTexteForm.get('cours')!.value
      cahierDeTexte.enseignantId = this.nouveauCahierDeTexteForm.get('enseignant')!.value

      this.cahierDeTexteService.create(cahierDeTexte).subscribe({
        next: (res) => {
          this.getcahiersDeTexte()
          this.closeNouveauCahierDeTexteModal()
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

  // Modals
  openNouveauCahierDeTexteModal(): void {
    this.getCours()
    this.getEnseignants()

    this.showNouveauCahierDeTexteModal = true
  }

  closeNouveauCahierDeTexteModal(): void {
    this.showNouveauCahierDeTexteModal = false

    this.nouveauCahierDeTexteForm.reset()
    this.nouveauCahierDeTexteForm.get('choisirParmiLesCours')!.setValue(true)
  }
}
