import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PeriodesEvaluation } from 'src/app/data/enums/PeriodesEvaluation';
import { TypesEvaluation } from 'src/app/data/enums/TypesEvaluation';
import { MatierePrerequis } from 'src/app/data/modules/orientation/models/MatierePrerequis.model';
import { NiveauEtude } from 'src/app/data/modules/orientation/models/NiveauEtude.model';
import { COLUMNS_SCHEMA } from 'src/app/data/types/PrerequisParcoursType';

@Component({
  selector: 'app-ajout-prerequis',
  templateUrl: './ajout-prerequis.component.html',
  styleUrls: ['./ajout-prerequis.component.scss']
})
export class AjoutPrerequisComponent implements OnInit {

  error: boolean = false
  noteVideError: boolean = false

  @Input() showPrerequisModal: boolean = false
  @Output() onAdd: EventEmitter<any> = new EventEmitter()
  @Output() onClose: EventEmitter<any> = new EventEmitter()
  @Input() niveauxEtude: NiveauEtude[] = []
  @Input() matieres: MatierePrerequis[] = []

  selectedNiveauEtude?: string
  displayedColumns: string[] = COLUMNS_SCHEMA.map(col => col.key);
  dataSource: any[] = [];
  columnsSchema: any = COLUMNS_SCHEMA;
  readonly periodesEvaluation = PeriodesEvaluation
  readonly typesEvaluation = TypesEvaluation

  constructor() { }

  ngOnInit(): void {
  }

  addRow() {
    let lastId: number = this.dataSource.length
    if (this.dataSource.length == 1 && this.dataSource[0]['matiere'] == null) {
      this.dataSource = []
      lastId = 0
    }
    const newRow = { id: lastId, "matiere": null, "periode": PeriodesEvaluation.EXAM, "evaluation": TypesEvaluation.MOY, "note": null }
    this.dataSource = [...this.dataSource, newRow];
  }

  removeRow(id: number) {
    this.dataSource = this.dataSource.filter((value: any) => value.id != id)
  }

  ajouterPrerequis(): void {
    if (this.selectedNiveauEtude != undefined) {
      if (this.dataSource.length != 0) {
        const nullNotes: number = this.dataSource.filter((value: any) => value.matiere == null || value.periode == null || value.evaluation == null || value.note == null).length

        if (nullNotes == 0) {
          console.log(this.dataSource)
          this.onAdd.emit([this.niveauxEtude.find(value => value.id == this.selectedNiveauEtude), this.dataSource])
          
          this.closeModal()
        }
        else {
          this.noteVideError = true
        }
      }
      else {
        this.error = true
      }
    }
    else {
      this.error = true
    }
  }

  closeModal(): void {
    this.error = false
    this.noteVideError = false
    this.showPrerequisModal = false
    this.selectedNiveauEtude = undefined
    this.dataSource = []
    this.onClose.emit()
  }
}
