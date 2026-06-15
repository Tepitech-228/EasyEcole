import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CoursParticipant } from 'src/app/data/modules/inscription/models/CoursParticipant.model';
import { ListeNoteEvaluation } from 'src/app/data/modules/inscription/models/ListeNoteEvaluation.model';
import { NoteEvaluation } from 'src/app/data/modules/inscription/models/NoteEvaluation.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { ListeNoteEvaluationService } from 'src/app/data/modules/inscription/services/liste-note-evaluation.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listeNoteEvaluationService: ListeNoteEvaluationService,
    private coursService: CoursService) {
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
}
