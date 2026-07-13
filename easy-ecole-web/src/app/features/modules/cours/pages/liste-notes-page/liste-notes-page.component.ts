import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ListeNoteEvaluation } from 'src/app/data/modules/inscription/models/ListeNoteEvaluation.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { ListeNoteEvaluationService } from 'src/app/data/modules/inscription/services/liste-note-evaluation.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { PvEvaluationService, PvImportResult } from 'src/app/data/modules/inscription/services/pv-evaluation.service';

@Component({
  selector: 'app-liste-notes-page',
  templateUrl: './liste-notes-page.component.html',
  styleUrls: ['./liste-notes-page.component.scss']
})
export class ListeNotesPageComponent extends BaseComponentClass implements OnInit {

  listesNotes: ListeNoteEvaluation[] = []
  _listesNotes: ListeNoteEvaluation[] = []

  niveauxEtude: NiveauEtude[] = []
  _niveauxEtude: NiveauEtude[] = []
  classes: Classe[] = []
  _classes: Classe[] = []
  parcours: Parcours[] = []
  _parcours: Parcours[] = []

  selectedNiveauEtude: string = 'undefined'
  selectedClasse: string = 'undefined'
  selectedParcours: string = 'undefined'

  searchNote?: string

  exportingPvId: string | null = null
  showImportModal: boolean = false
  importingPvId: string | null = null
  selectedFile: File | null = null
  importResult: PvImportResult | null = null
  importError: string | null = null

  constructor(
    private listeNoteEvaluationService: ListeNoteEvaluationService,
    private niveauEtudeService: NiveauEtudeService,
    private classeService: ClasseService,
    private parcoursService: ParcoursService,
    private pvEvaluationService: PvEvaluationService,
  ) {
    super()
    this.getNiveauxEtude()
    this.getClasses()
    this.getParcours()
    this.getListesNotes()
  }

  ngOnInit(): void { }

  getListesNotes(): void {
    this.listeNoteEvaluationService.getAll()
      .subscribe({
        next: (res) => {
          this.listesNotes = res
          this.filtrerListesNotes()
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  getNiveauxEtude(): void {
    this.niveauEtudeService.getAll()
      .subscribe({
        next: (res) => {
          this.niveauxEtude = res
          this._niveauxEtude = this.niveauxEtude
        },
        error: (err) => { console.log(err) }
      })
  }

  getClasses(): void {
    this.classeService.getAll()
      .subscribe({
        next: (res) => {
          this.classes = res
          this._classes = this.classes
        },
        error: (err) => { console.log(err) }
      })
  }

  getParcours(): void {
    this.parcoursService.getAll()
      .subscribe({
        next: (res) => {
          this.parcours = res
          this._parcours = this.parcours
        },
        error: (err) => { console.log(err) }
      })
  }

  filtrerListesNotes(): void {
    this._niveauxEtude = this.niveauxEtude.filter((value: NiveauEtude) => {
      return this.selectedNiveauEtude == 'undefined' || value.id == this.selectedNiveauEtude
    })
    this._classes = this.classes.filter((value: Classe) => {
      return this.selectedNiveauEtude == 'undefined' || value.niveauEtudeId == this.selectedNiveauEtude
    })
    this._parcours = this.parcours.filter((value: Parcours) => {
      return this.selectedNiveauEtude == 'undefined' || value.niveauEtudeId == this.selectedNiveauEtude
    })

    this._listesNotes = this.listesNotes.filter((value: ListeNoteEvaluation) => {
      return (this.selectedNiveauEtude == 'undefined' || value.cours?.parcours?.niveauEtudeId == this.selectedNiveauEtude) &&
        (this.selectedClasse == 'undefined' || value.cours?.classeId == this.selectedClasse) &&
        (this.selectedParcours == 'undefined' || value.cours?.parcoursId == this.selectedParcours)
    })
  }

  supprimerFiltres(): void {
    this.searchNote = undefined
    this.selectedNiveauEtude = 'undefined'
    this.selectedClasse = 'undefined'
    this.selectedParcours = 'undefined'
    this.filtrerListesNotes()
  }

  rechercherNote(): void {
    if (this.searchNote == undefined || this.searchNote == '') {
      this._listesNotes = this.listesNotes
    }
    else {
      this._listesNotes = this.listesNotes.filter((value: ListeNoteEvaluation) => {
        const coursIntitule = value.cours?.intitule?.toLowerCase() || ''
        const typeLibelle = value.typeNoteEvaluation?.libelle?.toLowerCase() || ''
        const query = this.searchNote!.toLowerCase()
        return coursIntitule.includes(query) || typeLibelle.includes(query)
      })
    }
  }

  moyenneNotes(liste: ListeNoteEvaluation): number {
    if (!liste.notesEvaluation || liste.notesEvaluation.length === 0) return 0
    const sum = liste.notesEvaluation.reduce((acc, n) => acc + (n.note || 0), 0)
    return Math.round((sum / liste.notesEvaluation.length) * 100) / 100
  }

  exportPv(liste: ListeNoteEvaluation): void {
    if (!liste.id) return
    this.exportingPvId = liste.id
    this.pvEvaluationService.exportPv(liste.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `PV_${liste.cours?.code || 'notes'}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        this.exportingPvId = null
      },
      error: () => { this.exportingPvId = null }
    })
  }

  openImportModal(liste: ListeNoteEvaluation): void {
    this.importingPvId = liste.id!
    this.showImportModal = true
    this.selectedFile = null
    this.importResult = null
    this.importError = null
  }

  closeImportModal(): void {
    this.showImportModal = false
    this.importingPvId = null
    this.selectedFile = null
    this.importResult = null
    this.importError = null
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0]
    if (file) this.selectedFile = file
  }

  importPv(): void {
    if (!this.importingPvId || !this.selectedFile) return
    this.importResult = null
    this.importError = null
    this.pvEvaluationService.importPv(this.importingPvId, this.selectedFile).subscribe({
      next: (result) => {
        this.importResult = result
        if (result.success) {
          this.getListesNotes()
        }
      },
      error: (err) => {
        this.importError = err.error?.message || "Erreur lors de l'import"
      }
    })
  }
}
