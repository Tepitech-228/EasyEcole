import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { DesignationMemoire, DesignationMemoireStatut } from 'src/app/data/modules/inscription/models/DesignationMemoire.model';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { DesignationMemoireService } from 'src/app/data/modules/inscription/services/designation-memoire.service';

export interface DesignationFormData {
  cursusApprenantId: string
  sujet: string
  superviseurId: string
  gradeSuperviseur: string
  emailSuperviseur: string
  telephoneSuperviseur: string
  dateDesignation: string
  statut: DesignationMemoireStatut
  commentaire: string
}

const EMPTY_FORM: DesignationFormData = {
  cursusApprenantId: '',
  sujet: '',
  superviseurId: '',
  gradeSuperviseur: '',
  emailSuperviseur: '',
  telephoneSuperviseur: '',
  dateDesignation: '',
  statut: 'propose',
  commentaire: '',
}

export interface DesignationMemoireRow {
  id?: string
  cursusApprenantId?: string
  etudiantNom: string
  classeLibelle: string
  sujet?: string
  superviseurId?: string
  superviseurNom: string
  gradeSuperviseur?: string
  emailSuperviseur?: string
  telephoneSuperviseur?: string
  dateDesignation?: string
  statut?: DesignationMemoireStatut
  commentaire?: string | null
  createdAt?: Date
}

@Component({
  selector: 'app-designation-memoire-page',
  templateUrl: './designation-memoire-page.component.html',
  styleUrls: ['./designation-memoire-page.component.scss']
})
export class DesignationMemoirePageComponent extends BaseComponentClass implements OnInit {

  designations: DesignationMemoireRow[] = []
  cursusList: CursusApprenant[] = []
  enseignants: Enseignant[] = []
  classes: Classe[] = []

  loading: boolean = false
  backendDisponible: boolean = true
  showForm: boolean = false
  editingId: string | null = null
  selectedClasseId: string = ''
  searchTerm: string = ''

  formData: DesignationFormData = { ...EMPTY_FORM }

  readonly statutOptions: { value: DesignationMemoireStatut, label: string, color: string }[] = [
    { value: 'propose', label: 'Proposé', color: 'blue' },
    { value: 'confirme', label: 'Confirmé', color: 'green' },
    { value: 'rejete', label: 'Rejeté', color: 'red' },
  ]

  constructor(
    private designationMemoireService: DesignationMemoireService,
    private cursusApprenantService: CursusApprenantService,
    private classeService: ClasseService,
    private enseignantService: EnseignantService,
    private toastService: ToastService,
    private router: Router
  ) {
    super()
  }

  ngOnInit(): void {
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
      this.router.navigate(['/'])
      return
    }
    this.loadReferences()
  }

  private loadReferences(): void {
    this.classeService.getAll().subscribe({
      next: (classes) => {
        this.classes = classes
      },
      error: (err) => console.error('Erreur chargement classes', err)
    })

    this.enseignantService.getAll().subscribe({
      next: (enseignants) => {
        this.enseignants = enseignants
      },
      error: (err) => console.error('Erreur chargement enseignants', err)
    })

    this.loadCursus()
    this.getDesignations()
  }

  loadCursus(): void {
    const params: any = { limit: 100 }
    if (this.selectedClasseId) {
      params.classeId = this.selectedClasseId
    }
    this.cursusApprenantService.getAllPaginated(params).subscribe({
      next: (res) => {
        this.cursusList = (res && (res.data || res)) || []
      },
      error: (err) => {
        console.error('Erreur chargement cursus', err)
        this.cursusList = []
      }
    })
  }

  getDesignations(): void {
    this.loading = true
    this.designationMemoireService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.backendDisponible = true
        const items: DesignationMemoire[] = res?.data || []
        this.designations = items.map(item => this.toRow(item))
        this.loading = false
      },
      error: (err) => {
        console.error('Erreur chargement désignations', err)
        this.backendDisponible = false
        this.designations = []
        this.loading = false
      }
    })
  }

  private toRow(d: DesignationMemoire): DesignationMemoireRow {
    const cursus = this.cursusList.find(c => String(c.id) === String(d.cursusApprenantId))
    const superviseur = this.enseignants.find(e => String(e.utilisateurId) === String(d.superviseurId))
    return {
      id: d.id,
      cursusApprenantId: d.cursusApprenantId,
      etudiantNom: this.formatEtudiant(cursus),
      classeLibelle: cursus?.classe?.libelle || '',
      sujet: d.sujet,
      superviseurId: d.superviseurId,
      superviseurNom: superviseur ? `${superviseur.utilisateur?.nom || ''} ${superviseur.utilisateur?.prenoms || ''}`.trim() : (d.emailSuperviseur || ''),
      gradeSuperviseur: d.gradeSuperviseur,
      emailSuperviseur: d.emailSuperviseur,
      telephoneSuperviseur: d.telephoneSuperviseur,
      dateDesignation: d.dateDesignation,
      statut: d.statut,
      commentaire: d.commentaire,
      createdAt: d.createdAt,
    }
  }

  formatEtudiant(c?: CursusApprenant): string {
    if (!c) return '-'
    const nom = c.utilisateur?.nom || ''
    const prenoms = c.utilisateur?.prenoms || ''
    return `${nom} ${prenoms}`.trim() || `Cursus #${c.id}`
  }

  get filteredDesignations(): DesignationMemoireRow[] {
    if (!this.searchTerm) return this.designations
    const q = this.searchTerm.toLowerCase()
    return this.designations.filter(d =>
      d.etudiantNom.toLowerCase().includes(q) ||
      (d.sujet || '').toLowerCase().includes(q) ||
      d.superviseurNom.toLowerCase().includes(q)
    )
  }

  // ── Formulaire ──────────────────────────────

  ouvrirFormulaire(): void {
    this.editingId = null
    this.formData = { ...EMPTY_FORM }
    this.showForm = true
  }

  editerDesignation(row: DesignationMemoireRow): void {
    this.editingId = row.id || null
    this.formData = {
      cursusApprenantId: row.cursusApprenantId || '',
      sujet: row.sujet || '',
      superviseurId: row.superviseurId || '',
      gradeSuperviseur: row.gradeSuperviseur || '',
      emailSuperviseur: row.emailSuperviseur || '',
      telephoneSuperviseur: row.telephoneSuperviseur || '',
      dateDesignation: row.dateDesignation || '',
      statut: row.statut || 'propose',
      commentaire: row.commentaire || '',
    }
    this.showForm = true
  }

  fermerFormulaire(): void {
    this.showForm = false
    this.editingId = null
  }

  onSuperviseurChange(): void {
    const enseignant = this.enseignants.find(e => String(e.utilisateurId) === String(this.formData.superviseurId))
    if (!enseignant) return
    this.formData.gradeSuperviseur = enseignant.gradeAcademique || enseignant.fonction || ''
    this.formData.emailSuperviseur = enseignant.utilisateur?.email || ''
    this.formData.telephoneSuperviseur = enseignant.utilisateur?.contact || enseignant.contact || ''
  }

  sauvegarder(): void {
    if (!this.formData.cursusApprenantId || !this.formData.sujet.trim() || !this.formData.superviseurId) {
      this.toastService.error('Veuillez renseigner l\'étudiant, le sujet et le directeur de mémoire.')
      return
    }

    const payload: Partial<DesignationMemoire> = {
      cursusApprenantId: this.formData.cursusApprenantId,
      sujet: this.formData.sujet.trim(),
      superviseurId: this.formData.superviseurId,
      gradeSuperviseur: this.formData.gradeSuperviseur || undefined,
      emailSuperviseur: this.formData.emailSuperviseur || undefined,
      telephoneSuperviseur: this.formData.telephoneSuperviseur || undefined,
      dateDesignation: this.formData.dateDesignation || undefined,
      statut: this.formData.statut,
      commentaire: this.formData.commentaire || null,
    }

    const request = this.editingId
      ? this.designationMemoireService.update(this.editingId, payload)
      : this.designationMemoireService.create(payload)

    request.subscribe({
      next: () => {
        this.toastService.success(this.editingId ? 'Désignation modifiée' : 'Désignation créée')
        this.fermerFormulaire()
        this.getDesignations()
      },
      error: (err) => {
        console.error(err)
        this.toastService.error(err?.error?.message || 'Erreur lors de l\'enregistrement. Vérifiez que le backend expose le CRUD /inscription/designation-memoires.')
      }
    })
  }

  supprimer(id?: string): void {
    if (!id) return
    if (!confirm('Supprimer cette désignation de directeur de mémoire ?')) return
    this.designationMemoireService.delete(id).subscribe({
      next: () => {
        this.toastService.success('Désignation supprimée')
        this.getDesignations()
      },
      error: (err) => {
        console.error(err)
        this.toastService.error('Erreur lors de la suppression.')
      }
    })
  }

  getStatutBadgeColor(statut?: string): string {
    const option = this.statutOptions.find(s => s.value === statut)
    return option?.color || 'gray'
  }

  getStatutLabel(statut?: string): string {
    const option = this.statutOptions.find(s => s.value === statut)
    return option?.label || statut || '-'
  }

  formatDate(v?: string | Date): string {
    if (!v) return '-'
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleDateString('fr-FR')
  }
}
