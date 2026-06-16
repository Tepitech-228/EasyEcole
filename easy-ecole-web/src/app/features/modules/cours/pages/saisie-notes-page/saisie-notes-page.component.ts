import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CoursParticipant } from 'src/app/data/modules/inscription/models/CoursParticipant.model';
import { ListeNoteEvaluation } from 'src/app/data/modules/inscription/models/ListeNoteEvaluation.model';
import { NoteEvaluation } from 'src/app/data/modules/inscription/models/NoteEvaluation.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { ListeNoteEvaluationService } from 'src/app/data/modules/inscription/services/liste-note-evaluation.service';
import { PvEvaluationService, PvImportResult } from 'src/app/data/modules/inscription/services/pv-evaluation.service';

@Component({
  selector: 'app-saisie-notes-page',
  templateUrl: './saisie-notes-page.component.html',
  styleUrls: ['./saisie-notes-page.component.scss']
})
export class SaisieNotesPageComponent extends BaseComponentClass implements OnInit {

  evaluation: ListeNoteEvaluation | null = null
  participants: CoursParticipant[] = []
  notesMap: { [coursParticipantId: string]: NoteEvaluation } = {}
  notesInput: { [coursParticipantId: string]: number | null } = {}
  loading: boolean = true
  saving: boolean = false
  success: boolean = false
  error: boolean = false

  exportingPv: boolean = false
  importingPv: boolean = false
  showImportModal: boolean = false
  selectedFile: File | null = null
  importResult: PvImportResult | null = null
  importError: string | null = null

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listeNoteEvaluationService: ListeNoteEvaluationService,
    private coursService: CoursService,
    private pvEvaluationService: PvEvaluationService) {
    super()
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.loadEvaluation(id)
    }
  }

  private loadEvaluation(id: string): void {
    this.listeNoteEvaluationService.get(id).subscribe({
      next: (res) => {
        this.evaluation = res
        this.loadParticipants(res.coursId!)
        this.initNotesMap(res.notesEvaluation || [])
      },
      error: (err) => {
        console.log(err)
        this.loading = false
      }
    })
  }

  private loadParticipants(coursId: string): void {
    this.coursService.getParticipants(coursId).subscribe({
      next: (res) => {
        this.participants = res
        this.loading = false
        this.participants.forEach(p => {
          if (this.notesInput[p.id!] === undefined) {
            this.notesInput[p.id!] = null
          }
        })
      },
      error: (err) => {
        console.log(err)
        this.loading = false
      }
    })
  }

  private initNotesMap(notes: NoteEvaluation[]): void {
    notes.forEach(n => {
      this.notesMap[n.coursParticipantId!] = n
      this.notesInput[n.coursParticipantId!] = n.note ?? null
    })
  }

  save(): void {
    if (!this.evaluation) return
    this.saving = true
    this.error = false
    this.success = false

    const notesToSave: NoteEvaluation[] = this.participants.map(p => {
      const existing = this.notesMap[p.id!]
      const val = this.notesInput[p.id!]
      const note = new NoteEvaluation()
      if (existing?.id) note.id = existing.id
      note.listeNoteEvaluationId = this.evaluation!.id
      note.coursParticipantId = p.id
      note.note = val ?? undefined
      return note
    })

    this.listeNoteEvaluationService.update({
      ...this.evaluation,
      notesEvaluation: notesToSave
    }).subscribe({
      next: () => {
        this.saving = false
        this.success = true
        setTimeout(() => this.success = false, 3000)
      },
      error: (err) => {
        console.log(err)
        this.saving = false
        this.error = true
        setTimeout(() => this.error = false, 3000)
      }
    })
  }

  exportPv(): void {
    if (!this.evaluation?.id) return
    this.exportingPv = true

    this.pvEvaluationService.exportPv(this.evaluation.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `PV_${this.evaluation?.cours?.code || 'notes'}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        this.exportingPv = false
      },
      error: (err) => {
        console.log(err)
        this.exportingPv = false
      }
    })
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0]
    if (file) {
      this.selectedFile = file
    }
  }

  openImportModal(): void {
    this.showImportModal = true
    this.selectedFile = null
    this.importResult = null
    this.importError = null
  }

  closeImportModal(): void {
    this.showImportModal = false
    this.selectedFile = null
    this.importResult = null
    this.importError = null
  }

  importPv(): void {
    if (!this.evaluation?.id || !this.selectedFile) return

    this.importingPv = true
    this.importResult = null
    this.importError = null

    this.pvEvaluationService.importPv(this.evaluation.id, this.selectedFile).subscribe({
      next: (result) => {
        this.importResult = result
        this.importingPv = false
        if (result.success) {
          this.loadEvaluation(this.evaluation!.id!)
        }
      },
      error: (err) => {
        this.importingPv = false
        this.importError = err.error?.message || 'Erreur lors de l\'import du fichier'
      }
    })
  }
}
