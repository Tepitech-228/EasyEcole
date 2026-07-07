import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
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

  publishing: boolean = false
  publishSuccess: boolean = false
  publishError: boolean = false
  publishMessage: string = ''
  showPublishModal: boolean = false

  exportingPv: boolean = false
  importingPv: boolean = false
  showImportModal: boolean = false
  selectedFile: File | null = null
  importResult: PvImportResult | null = null
  importError: string | null = null

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
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
    if (this.isPublished()) {
      this.error = true
      return
    }
    this.saving = true
    this.error = false
    this.success = false

    const notes = this.participants.map(p => ({
      coursParticipantId: p.id,
      note: this.notesInput[p.id!] ?? null
    }))

    const url = `${environment.API_MODULES.INSCRIPTION}/notesEvaluation/bulk-upsert`

    this.http.post(url, {
      listeNoteEvaluationId: this.evaluation.id,
      notes
    }).subscribe({
      next: () => {
        this.saving = false
        this.success = true
        setTimeout(() => this.success = false, 3000)
      },
      error: (err) => {
        console.error(err)
        this.saving = false
        this.error = true
        setTimeout(() => this.error = false, 3000)
      }
    })
  }

  isInvalidNote(value: number | null): boolean {
    if (value === null || value === undefined) return false
    return value < 0 || value > 20 || (value * 2) % 1 !== 0
  }

  openPublishModal(): void {
    this.showPublishModal = true
    this.publishMessage = ''
    this.publishSuccess = false
    this.publishError = false
  }

  closePublishModal(): void {
    this.showPublishModal = false
    this.publishMessage = ''
  }

  publishNotes(): void {
    if (!this.evaluation?.id) return
    this.publishing = true
    this.publishError = false
    this.publishSuccess = false

    const url = `${environment.API_MODULES.INSCRIPTION}/publications-notes/${this.evaluation.id}/publier`

    this.http.post(url, { message: this.publishMessage || undefined }).subscribe({
      next: () => {
        this.publishing = false
        this.publishSuccess = true
        this.showPublishModal = false
        this.loadEvaluation(String(this.evaluation!.id))
        setTimeout(() => this.publishSuccess = false, 5000)
      },
      error: (err) => {
        console.error(err)
        this.publishing = false
        this.publishError = true
      }
    })
  }

  isPublished(): boolean {
    if (!this.evaluation?.notesEvaluation?.length) return false
    return this.evaluation.notesEvaluation.some(n => n.statut === 'publie')
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
