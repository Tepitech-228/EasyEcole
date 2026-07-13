import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Parcours } from 'src/app/data/modules/orientation/models/Parcours.model';
import { ParcoursService } from 'src/app/data/modules/orientation/services/parcours.service';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { NiveauEtude } from 'src/app/data/modules/orientation/models/NiveauEtude.model';
import { PrerequisParcours } from 'src/app/data/modules/orientation/models/PrerequisParcours.model';
import { DeboucheParcours } from 'src/app/data/modules/orientation/models/DeboucheParcours.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PrerequisParcoursChoisi } from 'src/app/data/modules/orientation/models/PrerequisParcoursChoisi.model';
import { ParcoursChoisi } from 'src/app/data/modules/orientation/models/ParcoursChoisi.model';
import { ParcoursChoisiService } from 'src/app/data/modules/orientation/services/parcours-choisi.service';
import { PanierParcoursChoisiService } from 'src/app/data/modules/orientation/services/panier-parcours-choisi.service';
import { PanierParcoursChoisi } from 'src/app/data/modules/orientation/models/PanierParcoursChoisi.model';
import { environment } from 'src/environments/environment';
import { COLUMNS_SCHEMA, PrerequisParcoursType } from 'src/app/data/types/PrerequisParcoursType';

@Component({
  selector: 'app-details-parcours-page',
  templateUrl: './details-parcours-page.component.html',
  styleUrls: ['./details-parcours-page.component.scss']
})
export class DetailsParcoursPageComponent extends BaseComponentClass implements OnInit {

  showParcoursChoisiModal: boolean = false
  containsEmptyNote: boolean = false
  showDeboucheModal: boolean = false
  selectedDebouche?: DeboucheParcours

  columnsSchema: any = COLUMNS_SCHEMA;
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation
  _prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []
  _prerequisParcoursChoisi: Record<string, number | undefined> = {}

  id: string
  parcours?: Parcours

  readonly PARCOURS_PATH: string = environment.MEDIAS_PATH.ORIENTATION.PARCOURS

  constructor(
    private sanitizer: DomSanitizer,
    private parcoursService: ParcoursService,
    private parcoursChoisiService: ParcoursChoisiService,
    private panierParcoursChoisiService: PanierParcoursChoisiService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.id = this.activatedRoute.snapshot.paramMap.get("id") as string
    this.getParcours(this.id)
  }

  ngOnInit(): void {
  }

  getDuree(): string {
    return Parcours.getDuree(this.parcours?.dureeDeFormation)
  }

  getContenu(): SafeHtml | null {
    if (this.parcours && this.parcours.contenu) {
      return this.sanitizer.bypassSecurityTrustHtml(this.parcours.contenu)
    }

    return null
  }

  private getPrerequisParcoursChoisis(): void {
    this.parcours!.prerequisParcours!.forEach(element => {
      this._prerequisParcoursChoisi[element.id!] = undefined
    })
  }

  private getPrerequisParcours(): void {
    let prerequisParcours: [NiveauEtude, PrerequisParcoursType[]][] = []
    const niveauxEtude: NiveauEtude[] = this.parcours!.prerequisParcours!
      // Map to array
      .map(value => value.niveauEtude!)
      // Convert to set
      .reduce((accumulator: NiveauEtude[], current: NiveauEtude) => {
        if (!accumulator.map(value => value.id).includes(current.id)) {
          accumulator.push(current)
        }

        return accumulator;
      }, [])

    niveauxEtude.forEach((niveauEtude: NiveauEtude) => {
      let prerequis: [NiveauEtude, PrerequisParcoursType[]] = [niveauEtude, []]

      let array: PrerequisParcoursType[] = []
      this.parcours!.prerequisParcours!.filter(value => value.niveauEtudeId == niveauEtude.id).forEach((element: PrerequisParcours) => {
        array.push({
          id: element!.id!.toString(),
          matiere: element.matierePrerequis!.libelle!,
          evaluation: element.typeEvaluation!,
          periode: element.periodeEvaluation!,
          note: element.noteRequise!
        })
      })

      prerequis[1] = array
      prerequisParcours.push(prerequis)
    })

    this._prerequisParcours = prerequisParcours
  }

  getParcours(id: string): void {
    this.parcoursService.get(id)
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this.getPrerequisParcours()
            this.getPrerequisParcoursChoisis()
            console.log(this._prerequisParcoursChoisi)
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404) {
              this.router.navigate(['/orientation/parcours'])
            }
          },
        }
      )
  }

  supprimerParcours(): void {
    this.parcoursService.delete(this.id)
      .subscribe(
        {
          next: (res) => {
            this.router.navigate(['/orientation/parcours'])
          },
          error: (err: HttpErrorResponse) => {
            console.log(err)
            if (err.status == 404) {
              this.router.navigate(['/orientation/parcours'])
            }
          },
        }
      )
  }

  // Panier
  ajouterAuPanier(): void {
    this.containsEmptyNote = Object.values(this._prerequisParcoursChoisi).filter(value => value == undefined).length != 0
    console.log("Contains Empty note: " + this.containsEmptyNote)

    if (!this.containsEmptyNote) {
      let prerequisParcoursChoisis: PrerequisParcoursChoisi[] = []

      for (const key in this._prerequisParcoursChoisi) {
        const value = this._prerequisParcoursChoisi[key];
        console.log(key + ': ' + value);

        let prerequisParcoursChoisi: PrerequisParcoursChoisi = new PrerequisParcoursChoisi()
        prerequisParcoursChoisi.note = Number(value)
        prerequisParcoursChoisi.prerequisParcoursId = key

        prerequisParcoursChoisis.push(prerequisParcoursChoisi)
      }

      let parcoursChoisi: ParcoursChoisi = new ParcoursChoisi()
      parcoursChoisi.parcoursId = this.parcours!.id!
      parcoursChoisi.prerequisParcoursChoisis = prerequisParcoursChoisis

      this.parcoursChoisiService.create(parcoursChoisi)
        .subscribe(
          {
            next: (res) => {
              let panierParcoursChoisi: PanierParcoursChoisi = new PanierParcoursChoisi()
              panierParcoursChoisi.parcoursChoisiId = res.id
              
              this.panierParcoursChoisiService.create(panierParcoursChoisi)
              .subscribe(
                {
                  next: (res) => {
                    this.router.navigate(['/orientation/parcours'])
                  },
                  error: (err: HttpErrorResponse) => {
                    console.log(err)
                  },
                }
              )
            },
            error: (err: HttpErrorResponse) => {
              console.log(err)
            },
          }
        )
    }
  }

  getFullLink(video: string): string {
    if(video.includes('http')) {
      return video;
    }
    else {
      return  environment.MEDIAS_PATH.ORIENTATION.DEBOUCHES + video
    }
  }

  openModal(debouche: DeboucheParcours) {
    this.showDeboucheModal = true
    this.selectedDebouche = debouche
  }

  closeModal(): void {
    this.showDeboucheModal = false
  }

}
