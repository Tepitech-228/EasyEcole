import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-validation-bordereaux-page',
  templateUrl: './validation-bordereaux-page.component.html',
  styleUrls: ['./validation-bordereaux-page.component.scss']
})
export class ValidationBordereauxPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  successMessage: string = ''

  showValidationModal: boolean = false
  showRejetModal: boolean = false
  showPdfModal: boolean = false
  pdfBordereau?: Bordereau
  successResult: { type: 'inscription' | 'scolarite', matricule?: string, codeQuitus?: string } | null = null
  showSuccessModal: boolean = false

  bordereauxEnAttente: Bordereau[] = []
  selectedBordereau?: Bordereau
  commentaireRejet: string = ''

  activeFilter: 'tous' | 'inscription' | 'scolarite' = 'tous'

  // Filtres année / niveau / parcours
  annees: AnneeAcademique[] = []
  niveaux: NiveauEtude[] = []
  parcoursList: Parcours[] = []
  sessions: Session[] = []

  selectedAnneeId: string = ''
  selectedNiveauId: string = ''
  selectedParcoursId: string = ''

  niveauxFiltres: NiveauEtude[] = []
  parcoursFiltres: Parcours[] = []

  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  constructor(
    private bordereauService: BordereauService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private sanitizer: DomSanitizer,
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadAnnees()
    this.loadNiveaux()
    this.loadParcours()
    this.loadSessions()
    this.getBordereauxEnAttente()
  }

  loadAnnees(): void {
    this.anneeAcademiqueService.getAll().subscribe({
      next: (res) => { this.annees = res },
      error: (err) => console.log(err)
    })
  }

  loadNiveaux(): void {
    this.niveauEtudeService.getAll().subscribe({
      next: (res) => { this.niveaux = res },
      error: (err) => console.log(err)
    })
  }

  loadParcours(): void {
    this.parcoursService.getAll().subscribe({
      next: (res) => { this.parcoursList = res },
      error: (err) => console.log(err)
    })
  }

  loadSessions(): void {
    this.sessionService.getAll().subscribe({
      next: (res) => { this.sessions = res },
      error: (err) => console.log(err)
    })
  }

  onAnneeChange(): void {
    this.selectedNiveauId = ''
    this.selectedParcoursId = ''
    this.niveauxFiltres = []

    if (this.selectedAnneeId) {
      const sessionIds = this.sessions
        .filter(s => s.anneeAcademiqueId === this.selectedAnneeId)
        .map(s => s.niveauEtudeId)
      this.niveauxFiltres = this.niveaux.filter(n => sessionIds.includes(n.id))
    }
    this.getBordereauxEnAttente()
  }

  onNiveauChange(): void {
    this.selectedParcoursId = ''

    if (this.selectedNiveauId) {
      this.parcoursFiltres = this.parcoursList.filter(p => p.niveauEtudeId === this.selectedNiveauId)
    } else {
      this.parcoursFiltres = []
    }
    this.getBordereauxEnAttente()
  }

  onParcoursChange(): void {
    this.getBordereauxEnAttente()
  }

  get filteredBordereaux(): Bordereau[] {
    if (this.activeFilter === 'tous') return this.bordereauxEnAttente
    return this.bordereauxEnAttente.filter(b => (b.type || b.echeance?.type) === this.activeFilter)
  }

  get nbInscription(): number {
    return this.bordereauxEnAttente.filter(b => (b.type || b.echeance?.type) === 'inscription').length
  }

  get nbScolarite(): number {
    return this.bordereauxEnAttente.filter(b => (b.type || b.echeance?.type) === 'scolarite').length
  }

  setFilter(filter: 'tous' | 'inscription' | 'scolarite'): void {
    this.activeFilter = filter
  }

  getBordereauxEnAttente(): void {
    const params: any = { statut: 'en_attente' }
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId

    this.bordereauService.getAll(params).subscribe({
      next: (res) => {
        this.bordereauxEnAttente = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  validerBordereau(): void {
    if (this.selectedBordereau) {
      const type = this.selectedBordereau.type || this.selectedBordereau.echeance?.type
      const bordereauId = this.selectedBordereau.id

      this.bordereauService.valider(bordereauId!).subscribe({
        next: () => {
          this.getBordereauxEnAttente()
          this.closeValidationModal()

          this.successResult = { type: type || 'scolarite' }
          this.showSuccessModal = true
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  rejeterBordereau(): void {
    if (this.selectedBordereau && this.commentaireRejet.trim()) {
      this.bordereauService.rejeter(this.selectedBordereau.id!, this.commentaireRejet).subscribe({
        next: () => {
          this.successMessage = 'Bordereau rejeté'
          this.getBordereauxEnAttente()
          this.closeRejetModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  effriterFiltres(): void {
    this.selectedAnneeId = ''
    this.selectedNiveauId = ''
    this.selectedParcoursId = ''
    this.niveauxFiltres = []
    this.parcoursFiltres = []
    this.getBordereauxEnAttente()
  }

  getAnneeLibelle(id: string): string {
    return this.annees.find(a => a.id === id)?.libelle || id
  }

  getNiveauLibelle(id: string): string {
    return this.niveaux.find(n => n.id === id)?.libelle || id
  }

  getParcoursTitre(id: string): string {
    return this.parcoursList.find(p => p.id === id)?.titre || id
  }

  // Modals
  openValidationModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.showValidationModal = true
  }

  closeValidationModal(): void {
    this.showValidationModal = false
    this.selectedBordereau = undefined
  }

  openRejetModal(bordereau: Bordereau): void {
    this.selectedBordereau = bordereau
    this.commentaireRejet = ''
    this.showRejetModal = true
  }

  closeRejetModal(): void {
    this.showRejetModal = false
    this.selectedBordereau = undefined
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false
    this.successResult = null
    this.selectedBordereau = undefined
  }

  isImageFile(fichier: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fichier)
  }

  getDocUrl(fichier: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.BORDEREAUX_PATH + fichier)
  }

  openPdfModal(bordereau: Bordereau): void {
    this.pdfBordereau = bordereau
    this.showPdfModal = true
  }

  closePdfModal(): void {
    this.showPdfModal = false
    this.pdfBordereau = undefined
  }
}
