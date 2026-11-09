import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-liste-parcours-page',
  templateUrl: './liste-parcours-page.component.html',
  styleUrls: ['./liste-parcours-page.component.scss']
})
export class ListeParcoursPageComponent extends BaseComponentClass implements OnInit, OnDestroy {

  showEditerParcoursModal: boolean = false
  showSupprimerParcoursModal: boolean = false

  selectedCategory?: string
  parcours: Parcours[] = []
  _parcours: Parcours[] = []
  niveauxEtude: NiveauEtude[] = []

  selectedNiveauEtude: string = 'undefined'

  searchParcours: string = ''
  readonly pageSize: number = 25
  currentPage: number = 1

  private readonly searchTerms = new Subject<string>()
  private readonly destroy$ = new Subject<void>()

  parcoursForm: FormGroup = new FormGroup({
    titre: new FormControl(null, [Validators.required]),
    niveauEtude: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor(
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,) {
    super()
  }

  ngOnInit(): void {
    this.searchTerms
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((query) => {
        this.searchParcours = query
        this.currentPage = 1
        this.appliquerFiltres()
      })

    this.getNiveauxEtude()
    this.getParcours()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.searchTerms.complete()
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

  private getParcours(): void {
    this.parcoursService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.parcours = res
            this.appliquerFiltres()
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }
  
  filtrerParcours(): void {
    this.currentPage = 1
    this.appliquerFiltres()
  }

  rechercherParcours(query: string): void {
    this.searchTerms.next(query || '')
  }

  private appliquerFiltres(): void {
    const niveauSelectionne = this.selectedNiveauEtude
    const terme = this.searchParcours.trim().toLowerCase()

    this._parcours = this.parcours.filter((parcours) => {
      const correspondAuNiveau = niveauSelectionne === 'undefined'
        || String(parcours.niveauEtudeId) === niveauSelectionne
      const correspondAuTerme = !terme
        || (parcours.titre || '').toLowerCase().includes(terme)

      return correspondAuNiveau && correspondAuTerme
    })
  }

  get parcoursPage(): Parcours[] {
    const debut = (this.currentPage - 1) * this.pageSize
    return this._parcours.slice(debut, debut + this.pageSize)
  }

  get nombrePages(): number {
    return Math.ceil(this._parcours.length / this.pageSize)
  }

  get premierResultat(): number {
    return this._parcours.length ? (this.currentPage - 1) * this.pageSize + 1 : 0
  }

  get dernierResultat(): number {
    return Math.min(this.currentPage * this.pageSize, this._parcours.length)
  }

  changerPage(page: number): void {
    if (page >= 1 && page <= this.nombrePages) {
      this.currentPage = page
    }
  }

  trackByParcours(index: number, parcours: Parcours): string | number {
    return parcours.id || index
  }

  ajouterParcours(): void {
    this.parcoursForm.markAllAsTouched()
  }

}
