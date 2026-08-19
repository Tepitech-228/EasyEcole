import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { RattrapageSession } from 'src/app/data/modules/inscription/models/RattrapageWorkflow.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { RattrapageWorkflowService } from 'src/app/data/modules/inscription/services/rattrapage-workflow.service';

/** Ligne d'un document requis édité dans la modal (création/édition de session). */
interface DocumentRequisEdite {
  libelle: string;
  obligatoire: boolean;
  ordre: number;
}

@Component({
  selector: 'app-rattrapage-sessions-page',
  templateUrl: './rattrapage-sessions-page.component.html',
  styleUrls: ['./rattrapage-sessions-page.component.scss']
})
export class RattrapageSessionsPageComponent extends BaseComponentClass implements OnInit {

  sessions: RattrapageSession[] = []
  classes: Classe[] = []
  annees: AnneeAcademique[] = []
  loading: boolean = false
  saving: boolean = false
  errorMessage: string = ''
  successMessage: string = ''

  // Modal création / édition
  showSessionModal: boolean = false
  sessionEnEdition: RattrapageSession | null = null
  documentsRequisEdites: DocumentRequisEdite[] = []

  readonly Aujourdhui: string = (new Date()).toISOString().split('T')[0]

  sessionForm: FormGroup = new FormGroup({
    libelle: new FormControl('', [Validators.required]),
    dateDebut: new FormControl('', [Validators.required]),
    dateFin: new FormControl('', [Validators.required]),
    anneeAcademiqueId: new FormControl(null, []),
    description: new FormControl('', []),
    classesId: new FormControl([], [])
  })

  constructor(
    private router: Router,
    private rattrapageWorkflowService: RattrapageWorkflowService,
    private classeService: ClasseService,
    private anneeAcademiqueService: AnneeAcademiqueService
  ) {
    super()
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.loadSessions()
    this.loadClasses()
    this.loadAnnees()
  }

  loadSessions(): void {
    this.loading = true
    this.rattrapageWorkflowService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions
        this.loading = false
      },
      error: (err) => {
        console.error('Erreur chargement sessions de rattrapage:', err)
        this.errorMessage = 'Erreur lors du chargement des sessions de rattrapage'
        this.loading = false
      }
    })
  }

  loadClasses(): void {
    this.classeService.getAll().subscribe({
      next: (classes) => { this.classes = classes },
      error: (err) => console.error('Erreur chargement classes:', err)
    })
  }

  loadAnnees(): void {
    this.anneeAcademiqueService.getAll().subscribe({
      next: (annees) => { this.annees = annees },
      error: (err) => console.error('Erreur chargement années académiques:', err)
    })
  }

  // ---------------------------------------------------------------------------
  // Modal création / édition
  // ---------------------------------------------------------------------------

  openNouvelleSessionModal(): void {
    this.sessionEnEdition = null
    this.documentsRequisEdites = []
    this.sessionForm.reset()
    this.sessionForm.patchValue({ dateDebut: this.Aujourdhui, classesId: [] })
    this.showSessionModal = true
  }

  openEditionSessionModal(session: RattrapageSession): void {
    this.sessionEnEdition = session
    this.documentsRequisEdites = (session.documentsRequis || []).map((doc) => ({
      libelle: doc.libelle || '',
      obligatoire: !!doc.obligatoire,
      ordre: doc.ordre || 0
    }))
    this.sessionForm.reset()
    this.sessionForm.patchValue({
      libelle: session.libelle || '',
      dateDebut: session.dateDebut ? session.dateDebut.substring(0, 10) : '',
      dateFin: session.dateFin ? session.dateFin.substring(0, 10) : '',
      anneeAcademiqueId: session.anneeAcademiqueId || null,
      description: session.description || '',
      classesId: (session.classes || []).map((c) => c.classe.id)
    })
    this.showSessionModal = true
  }

  closeSessionModal(): void {
    this.showSessionModal = false
    this.sessionEnEdition = null
    this.documentsRequisEdites = []
    this.sessionForm.reset()
  }

  ajouterDocumentRequis(): void {
    this.documentsRequisEdites.push({ libelle: '', obligatoire: true, ordre: this.documentsRequisEdites.length + 1 })
  }

  supprimerDocumentRequis(index: number): void {
    this.documentsRequisEdites.splice(index, 1)
    this.documentsRequisEdites.forEach((doc, i) => { doc.ordre = i + 1 })
  }

  private buildPayload(): any {
    const formValue = this.sessionForm.value
    const documentsRequis = this.documentsRequisEdites
      .filter((doc) => doc.libelle && doc.libelle.trim() !== '')
      .map((doc, index) => ({
        libelle: doc.libelle.trim(),
        obligatoire: !!doc.obligatoire,
        ordre: doc.ordre || index + 1
      }))

    const classesId: number[] = (formValue.classesId || []).map((id: any) => Number(id))

    return {
      libelle: formValue.libelle,
      dateDebut: formValue.dateDebut,
      dateFin: formValue.dateFin,
      anneeAcademiqueId: formValue.anneeAcademiqueId ? Number(formValue.anneeAcademiqueId) : undefined,
      description: formValue.description || undefined,
      classesId: classesId,
      documentsRequis: documentsRequis
    }
  }

  enregistrerSession(): void {
    this.sessionForm.markAllAsTouched()
    if (this.sessionForm.invalid) return

    this.saving = true
    this.errorMessage = ''
    const payload = this.buildPayload()

    const action = this.sessionEnEdition
      ? this.rattrapageWorkflowService.updateSession(this.sessionEnEdition.id!, payload)
      : this.rattrapageWorkflowService.createSession(payload)

    action.subscribe({
      next: () => {
        this.saving = false
        this.successMessage = this.sessionEnEdition ? 'Session de rattrapage mise à jour' : 'Session de rattrapage créée'
        this.closeSessionModal()
        setTimeout(() => { this.successMessage = '' }, 4000)
        this.loadSessions()
      },
      error: (err) => {
        console.error('Erreur enregistrement session:', err)
        this.saving = false
        this.errorMessage = err?.error?.message || err?.message || 'Erreur lors de l\'enregistrement de la session'
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Ouverture / clôture
  // ---------------------------------------------------------------------------

  ouvrirSession(session: RattrapageSession): void {
    if (!session.id || session.statut === 'ouverte') return
    this.rattrapageWorkflowService.ouvrirSession(session.id).subscribe({
      next: () => { this.loadSessions() },
      error: (err) => console.error('Erreur ouverture session:', err)
    })
  }

  cloturerSession(session: RattrapageSession): void {
    if (!session.id || session.statut === 'cloturee') return
    this.rattrapageWorkflowService.cloturerSession(session.id).subscribe({
      next: () => { this.loadSessions() },
      error: (err) => console.error('Erreur clôture session:', err)
    })
  }

  // ---------------------------------------------------------------------------
  // Helpers d'affichage
  // ---------------------------------------------------------------------------

  getStatutBadgeColor(statut?: string): string {
    switch (statut) {
      case 'ouverte': return 'green'
      case 'cloturee': return 'red'
      default: return 'yellow'
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'ouverte': return 'Ouverte'
      case 'cloturee': return 'Clôturée'
      default: return 'En préparation'
    }
  }

  getClassesLabel(session: RattrapageSession): string {
    const libelles = (session.classes || []).map((c) => c.classe.libelle).filter(Boolean)
    if (libelles.length === 0) return 'Toutes les classes'
    if (libelles.length <= 3) return libelles.join(', ')
    return `${libelles.slice(0, 3).join(', ')} +${libelles.length - 3}`
  }

  getAnneeLibelle(session: RattrapageSession): string {
    if (session.anneeAcademique?.libelle) return session.anneeAcademique.libelle
    return this.annees.find((a) => String(a.id) === String(session.anneeAcademiqueId))?.libelle || 'N/A'
  }
}