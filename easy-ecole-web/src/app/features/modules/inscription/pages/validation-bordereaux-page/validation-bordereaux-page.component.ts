import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
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
import { DossierNode, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';

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
  dataLoaded: boolean = false

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalItems: number = 0;
  totalPages: number = 1;

  // Batch
  selectedIds: number[] = [];
  batchLoading: boolean = false;

  // Dossier tree
  treeNodes: DossierNode[] = [];
  itemColumns = [
    { key: 'type', label: 'Type' },
    { key: 'montant', label: 'Montant' },
    { key: 'referenceBancaire', label: 'Référence' },
    { key: 'dateSoumission', label: 'Date' }
  ];
  batchActions: BatchAction[] = [
    { label: 'Voir le bordereau', color: 'blue', action: 'voirBordereau', icon: 'visibility' },
    { label: 'Valider', color: 'green', action: 'valider' },
    { label: 'Rejeter', color: 'red', action: 'rejeter' }
  ];

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
    // Charger toutes les données en parallèle avec combineLatest
    combineLatest([
      this.anneeAcademiqueService.getAll(),
      this.niveauEtudeService.getAll(),
      this.parcoursService.getAll(),
      this.sessionService.getAll()
    ]).subscribe({
      next: ([annees, niveaux, parcours, sessions]) => {
        console.log('Data loaded - Annees:', annees.length, 'Niveaux:', niveaux.length, 'Parcours:', parcours.length, 'Sessions:', sessions.length)
        this.annees = annees
        this.niveaux = niveaux
        this.parcoursList = parcours
        this.sessions = sessions
        this.dataLoaded = true
      },
      error: (err) => {
        console.error('Erreur chargement données:', err)
        this.dataLoaded = true
      }
    })

    this.getBordereauxEnAttente()
  }

  onAnneeChange(): void {
    this.selectedNiveauId = ''
    this.selectedParcoursId = ''
    this.niveauxFiltres = []
    this.parcoursFiltres = []

    if (this.selectedAnneeId) {
      // Récupérer tous les niveaux associés à l'année sélectionnée via les sessions
      const niveauIds = new Set<string>()
      
      // Log pour debug
      console.log('Sessions loaded:', this.sessions.length)
      console.log('Selected annee:', this.selectedAnneeId)
      
      this.sessions
        .filter(s => s.anneeAcademiqueId && String(s.anneeAcademiqueId) === String(this.selectedAnneeId))
        .forEach(s => {
          if (s.niveauEtudeId) {
            niveauIds.add(String(s.niveauEtudeId))
            console.log('Found niveau:', s.niveauEtudeId)
          }
        })
      
      console.log('Niveaux found:', Array.from(niveauIds))
      
      // Si aucun niveau trouvé via sessions, afficher tous les niveaux
      if (niveauIds.size === 0) {
        console.log('No niveaux found, showing all')
        this.niveauxFiltres = this.niveaux
      } else {
        this.niveauxFiltres = this.niveaux.filter(n => niveauIds.has(String(n.id!)))
      }
    }
    this.getBordereauxEnAttente()
  }

  onNiveauChange(): void {
    this.selectedParcoursId = ''
    this.parcoursFiltres = []

    if (this.selectedNiveauId) {
      console.log('Filtering parcours for niveau:', this.selectedNiveauId)
      console.log('Parcours list:', this.parcoursList)
      
      this.parcoursFiltres = this.parcoursList.filter(p => {
        const match = String(p.niveauEtudeId) === String(this.selectedNiveauId)
        console.log(`Parcours ${p.titre}: niveauEtudeId=${p.niveauEtudeId}, match=${match}`)
        return match
      })
      
      console.log('Parcours filtered:', this.parcoursFiltres)
      
      // Si aucun parcours trouvé, afficher tous
      if (this.parcoursFiltres.length === 0) {
        console.log('No parcours found, showing all')
        this.parcoursFiltres = this.parcoursList
      }
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
    const params: any = { 
      statut: 'en_attente',
      page: this.currentPage,
      limit: this.pageSize
    }
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId

    this.bordereauService.getAll(params).subscribe({
      next: (res: any) => {
        this.bordereauxEnAttente = res.data || res
        this.totalItems = res.pagination?.total || this.bordereauxEnAttente.length
        this.totalPages = res.pagination?.totalPages || 1
        this.buildTreeNodes()
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

  private buildTreeNodes(): void {
    const groups: { [key: string]: any } = {};
    for (const b of this.bordereauxEnAttente) {
      const anneeKey: string = this.selectedAnneeId || 'toutes-annees';
      const niveauKey: string = this.selectedNiveauId || 'tous-niveaux';
      const parcoursKey: string = this.selectedParcoursId || 'tous-parcours';
      const etudiantKey: string = b.utilisateurId || 'sans-etudiant';
      const etudiantLabel = b.utilisateur 
        ? `${b.utilisateur.nom || ''} ${b.utilisateur.prenoms || ''}`.trim() || `#${b.utilisateurId}` 
        : `#${b.utilisateurId}`;
      
      if (!groups[anneeKey]) groups[anneeKey] = {};
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey]) groups[anneeKey][niveauKey][parcoursKey] = {};
      if (!groups[anneeKey][niveauKey][parcoursKey][etudiantKey]) groups[anneeKey][niveauKey][parcoursKey][etudiantKey] = { label: etudiantLabel, items: [] };
      groups[anneeKey][niveauKey][parcoursKey][etudiantKey].items.push(b);
    }

    this.treeNodes = Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: this.getAnneeLibelle(anneeKey),
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, parcours]: [string, any]) => ({
        type: 'niveau' as const,
        label: this.getNiveauLibelle(niveauKey),
        expanded: true,
        children: Object.entries(parcours).map(([parcoursKey, etudiants]: [string, any]) => ({
          type: 'parcours' as const,
          label: this.getParcoursTitre(parcoursKey),
          expanded: true,
          children: Object.entries(etudiants).map(([etudiantKey, etudiant]: [string, any]) => ({
            type: 'etudiant' as const,
            label: etudiant.label,
            id: etudiantKey,
            expanded: true,
            items: etudiant.items
          }))
        }))
      }))
    }));
  }

  onSelectionChange(event: { ids: number[] }): void {
    this.selectedIds = event.ids;
  }

  onBatchAction(event: { action: string; ids: number[] }): void {
    if (event.action === 'voirBordereau') {
      return;
    } else if (event.action === 'rejeter') {
      this.commentaireRejet = '';
      this.showRejetModal = true;
    } else if (event.action === 'valider') {
      this.executeBatchValidation(event.ids);
    }
  }

  onItemAction(event: { item: any; action: string }): void {
    if (event.action === 'valider') {
      this.selectedBordereau = event.item;
      this.showValidationModal = true;
    } else if (event.action === 'rejeter') {
      this.selectedBordereau = event.item;
      this.commentaireRejet = '';
      this.showRejetModal = true;
    } else if (event.action === 'voirBordereau') {
      this.openPdfModal(event.item);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getBordereauxEnAttente();
  }

  private executeBatchValidation(ids: number[]): void {
    this.batchLoading = true;
    this.bordereauService.batchValider(ids).subscribe({
      next: () => {
        this.batchLoading = false;
        this.selectedIds = [];
        this.getBordereauxEnAttente();
      },
      error: () => {
        this.batchLoading = false;
      }
    });
  }

  confirmerRejetBatch(): void {
    if (this.selectedIds.length === 0 || !this.commentaireRejet.trim()) return;
    this.batchLoading = true;
    this.bordereauService.batchRejeter(this.selectedIds, this.commentaireRejet).subscribe({
      next: () => {
        this.batchLoading = false;
        this.selectedIds = [];
        this.showRejetModal = false;
        this.getBordereauxEnAttente();
      },
      error: () => {
        this.batchLoading = false;
      }
    });
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
