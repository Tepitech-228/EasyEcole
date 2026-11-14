import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { ListePresence } from 'src/app/data/modules/inscription/models/ListePresence.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { ListePresenceService } from 'src/app/data/modules/inscription/services/liste-presence.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';

@Component({
  selector: 'app-liste-presences-page',
  templateUrl: './liste-presences-page.component.html',
  styleUrls: ['./liste-presences-page.component.scss']
})
export class ListePresencesPageComponent extends BaseComponentClass implements OnInit {

  alreadyExists: boolean = false
  error: boolean = false
  generationEnCours: boolean = false
  generationMessage: string | null = null
  generationErreur: string | null = null

  // cursusApprenant?: CursusApprenant
  listesPresences: ListePresence[] = []
  _listesPresences: ListePresence[] = []

  niveauxEtude: NiveauEtude[] = []
  _niveauxEtude: NiveauEtude[] = []
  classes: Classe[] = []
  _classes: Classe[] = []
  parcours: Parcours[] = []
  _parcours: Parcours[] = []

  selectedNiveauEtude: string = 'undefined'
  selectedClasse: string = 'undefined'
  selectedParcours: string = 'undefined'

  searchListePresence?: string

  showNouvelleListePresenceModal: boolean = false

  cours: Cours[] = []
  coursLoading: boolean = false
  enseignants: Enseignant[] = []
  enseignantsLoading: boolean = false

  nouvelleListePresenceForm: FormGroup = new FormGroup({
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
    private listePresenceService: ListePresenceService,
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
    this.getListesPresences()
    // }
  }

  ngOnInit(): void {
  }

  filtrerListesPresences(): void {
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

    this._listesPresences = this.listesPresences.filter((value: ListePresence) => {
      const niveauEtudeId = value.niveauEtudeId ?? value.cours?.parcours?.niveauEtudeId
      const parcoursId = value.parcoursId ?? value.cours?.parcoursId
      const classeCorrespondante = this.selectedClasse == 'undefined'
        || value.cours?.classeId == this.selectedClasse
        || (!value.cours && this.classes.some(classe =>
          classe.id == this.selectedClasse
          && classe.parcoursId == parcoursId
          && classe.niveauEtudeId == niveauEtudeId
        ))
      return (this.selectedNiveauEtude == 'undefined' || niveauEtudeId == this.selectedNiveauEtude) &&
        classeCorrespondante &&
        (this.selectedParcours == 'undefined' || parcoursId == this.selectedParcours)
    })
  }

  supprimerFiltres(): void {
    this.searchListePresence = undefined

    this.selectedNiveauEtude = 'undefined'
    this.selectedClasse = 'undefined'
    this.selectedParcours = 'undefined'
    this.filtrerListesPresences()
  }

  rechercherPresence(): void {
    if (this.searchListePresence == undefined || this.searchListePresence == '') {
      this._listesPresences = this.listesPresences
    }
    else {
      this._listesPresences = this.listesPresences.filter((value: ListePresence) => {
        const recherche = this.searchListePresence!.toLowerCase()
        return value.titre?.toLowerCase().includes(recherche) || value.description?.toLowerCase().includes(recherche)
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

  getListesPresences(): void {
    this.listePresenceService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.listesPresences = res
            this.filtrerListesPresences()
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  genererTousLesCahiers(): void {
    if (this.generationEnCours) return
    this.generationEnCours = true
    this.generationMessage = null
    this.generationErreur = null
    this.listePresenceService.genererTousLesCahiers().subscribe({
      next: resultat => {
        this.generationMessage = resultat.cohortesTraitees === 0
          ? 'Aucune filière avec niveau et cours rattaché à ce site.'
          : `${resultat.listesPresencesCrees} cahier(s) de présence et ${resultat.cahiersDeTexteCrees} cahier(s) de texte créé(s) pour ${resultat.cohortesTraitees} filière(s)/niveau(x).`
        this.getListesPresences()
      },
      error: err => {
        this.generationErreur = err.error?.message || 'La génération des cahiers a échoué.'
        this.generationEnCours = false
      },
      complete: () => {
        this.generationEnCours = false
      }
    })
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
      this.nouvelleListePresenceForm.get('titre')!.setValue(event.code)
      this.nouvelleListePresenceForm.get('description')!.setValue(event.intitule)
      this.nouvelleListePresenceForm.get('enseignant')!.setValue(event.enseignantId)
    }
  }

  ajouterPresence(): void {
    console.log(this.nouvelleListePresenceForm.valid, this.nouvelleListePresenceForm.value)
    this.nouvelleListePresenceForm.markAllAsTouched()
    if (this.nouvelleListePresenceForm.valid) {
      let listePresence: ListePresence = new ListePresence()
      listePresence.titre = this.nouvelleListePresenceForm.get('titre')!.value
      listePresence.description = this.nouvelleListePresenceForm.get('description')!.value
      listePresence.coursId = this.nouvelleListePresenceForm.get('cours')!.value
      listePresence.enseignantId = this.nouvelleListePresenceForm.get('enseignant')!.value

      this.listePresenceService.create(listePresence).subscribe({
        next: (res) => {
          this.getListesPresences()
          this.closeNouvelleListePresenceModal()
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
  openNouvelleListePresenceModal(): void {
    this.getCours()
    if (!this.rolesValue.isSurveillant) {
      this.getEnseignants()
    }

    this.showNouvelleListePresenceModal = true
  }

  closeNouvelleListePresenceModal(): void {
    this.showNouvelleListePresenceModal = false

    this.nouvelleListePresenceForm.reset()
    this.nouvelleListePresenceForm.get('choisirParmiLesCours')!.setValue(true)
  }
}
