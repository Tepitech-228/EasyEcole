import { Component, OnInit, ViewChild } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { environment } from 'src/environments/environment';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { FilterValue } from 'src/app/shared/components/filters-annee-niveau-parcours/filters-annee-niveau-parcours.component';
import { combineLatest } from 'rxjs';
import { ExcelService } from 'src/app/data/modules/inscription/services/excel.service';
import { ExcelImportDialogComponent } from 'src/app/shared/components/excel-import-dialog/excel-import-dialog.component';

@Component({
  selector: 'app-liste-effectifs-page',
  templateUrl: './liste-effectifs-page.component.html',
  styleUrls: ['./liste-effectifs-page.component.scss']
})
export class ListeEffectifsPageComponent extends BaseComponentClass implements OnInit {

  @ViewChild('importDialog') importDialog!: ExcelImportDialogComponent;

  effectifs: CursusApprenant[] = []
  error: boolean = false
  loading: boolean = false

  annees: AnneeAcademique[] = []
  niveaux: NiveauEtude[] = []
  parcoursList: Parcours[] = []
  classes: Classe[] = []

  selectedAnneeId: string = ''
  selectedNiveauId: string = ''
  selectedParcoursId: string = ''
  selectedClasseId: string = ''
  searchTerm: string = ''

  niveauxFiltres: NiveauEtude[] = []
  parcoursFiltres: Parcours[] = []
  classesFiltres: Classe[] = []

  page: number = 1
  limit: number = 20
  total: number = 0
  totalPages: number = 0

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  readonly columns: DossierColumn[] = [
    { key: 'matricule', label: 'Matricule', width: '120px' },
    { key: 'nom', label: 'Nom & Prénoms' },
    { key: 'classe', label: 'Classe', width: '120px' },
    { key: 'statut', label: 'Statut', width: '100px' },
    { key: 'dateInscription', label: 'Inscription', width: '120px' },
  ]

  readonly batchActions: BatchAction[] = [
    { label: 'Actif', color: 'green', action: 'actif', icon: 'check_circle' },
    { label: 'Suspendre', color: 'yellow', action: 'suspendu', icon: 'pause_circle' },
    { label: 'Archiver', color: 'red', action: 'archive', icon: 'archive' },
  ]

  constructor(
    private cursusApprenantService: CursusApprenantService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private classeService: ClasseService,
    private excelService: ExcelService,
  ) {
    super()
  }

  ngOnInit(): void {
    combineLatest([
      this.anneeAcademiqueService.getAll(),
      this.niveauEtudeService.getAll(),
      this.parcoursService.getAll(),
      this.classeService.getAll()
    ]).subscribe({
      next: ([annees, niveaux, parcours, classes]) => {
        this.annees = annees
        this.niveaux = niveaux
        this.parcoursList = parcours
        this.classes = classes
        this.getEffectifs()
      },
      error: (err) => {
        console.log(err)
        this.loading = false
      }
    })
  }

  onFilterChange(filters: FilterValue): void {
    this.selectedAnneeId = filters.anneeId
    this.selectedNiveauId = filters.niveauId
    this.selectedParcoursId = filters.parcoursId
    this.selectedClasseId = ''
    this.classesFiltres = []
    this.page = 1

    if (this.selectedAnneeId) {
      const niveauIds = new Set<string>()
      this.parcoursList
        .filter(p => {
          const session = (p as any).session
          return session?.anneeAcademiqueId && String(session.anneeAcademiqueId) === String(this.selectedAnneeId)
        })
        .forEach(p => { if (p.niveauEtudeId) niveauIds.add(String(p.niveauEtudeId)) })
      this.niveauxFiltres = niveauIds.size > 0
        ? this.niveaux.filter(n => niveauIds.has(String(n.id!)))
        : this.niveaux
    } else {
      this.niveauxFiltres = []
    }

    if (this.selectedNiveauId) {
      this.parcoursFiltres = this.parcoursList.filter(p =>
        String(p.niveauEtudeId) === String(this.selectedNiveauId)
      )
    } else {
      this.parcoursFiltres = []
    }

    if (this.selectedParcoursId) {
      this.classesFiltres = this.classes.filter(c => {
        const parcours = this.parcoursList.find(p => String(p.id) === String(this.selectedParcoursId))
        return parcours && String(c.niveauEtudeId) === String(parcours.niveauEtudeId)
      })
    } else {
      this.classesFiltres = []
    }

    this.getEffectifs()
  }

  onClasseChange(): void {
    this.page = 1
    this.getEffectifs()
  }

  onSearch(): void {
    this.page = 1
    this.getEffectifs()
  }

  onPageChange(page: number): void {
    this.page = page
    this.getEffectifs()
  }

  onBatchAction(event: { action: string, ids: number[] }): void {
    for (const id of event.ids) {
      this.cursusApprenantService.update({ id: String(id), externe: false } as any).subscribe({
        error: (err) => console.log(err)
      })
    }
    this.getEffectifs()
  }

  getEffectifs(): void {
    this.loading = true
    this.error = false

    const params: any = {
      page: this.page,
      limit: this.limit
    }
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId
    if (this.selectedClasseId) params.classeId = this.selectedClasseId
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim()

    this.cursusApprenantService.getAllPaginated(params).subscribe({
      next: (res) => {
        this.effectifs = res.data
        this.page = res.pagination.page
        this.limit = res.pagination.limit
        this.total = res.pagination.total
        this.totalPages = res.pagination.totalPages
        this.loading = false
      },
      error: (err) => {
        console.log(err)
        this.error = true
        this.loading = false
      }
    })
  }

  get treeNodes(): DossierNode[] {
    return this.buildTreeNodes()
  }

  private buildTreeNodes(): DossierNode[] {
    const groups: { [key: string]: any } = {}
    for (const c of this.effectifs) {
      const anneeKey: string = this.selectedAnneeId || c.anneeAcademiqueId || 'toutes-annees'
      const niveauKey: string = this.selectedNiveauId || c.niveauEtudeId || 'tous-niveaux'
      const parcoursKey: string = this.selectedParcoursId || c.parcoursId || 'tous-parcours'
      const classeKey: string = this.selectedClasseId || c.classeId || 'toutes-classes'

      if (!groups[anneeKey]) groups[anneeKey] = {}
      if (!groups[anneeKey][niveauKey]) groups[anneeKey][niveauKey] = {}
      if (!groups[anneeKey][niveauKey][parcoursKey]) groups[anneeKey][niveauKey][parcoursKey] = {}
      if (!groups[anneeKey][niveauKey][parcoursKey][classeKey]) groups[anneeKey][niveauKey][parcoursKey][classeKey] = { items: [] }
      groups[anneeKey][niveauKey][parcoursKey][classeKey].items.push(c)
    }

    return Object.entries(groups).map(([anneeKey, niveaux]: [string, any]) => ({
      type: 'annee' as const,
      label: this.getAnneeLibelle(anneeKey),
      expanded: true,
      children: Object.entries(niveaux).map(([niveauKey, parcours]: [string, any]) => ({
        type: 'niveau' as const,
        label: this.getNiveauLibelle(niveauKey),
        expanded: true,
        children: Object.entries(parcours).map(([parcoursKey, classes]: [string, any]) => ({
          type: 'parcours' as const,
          label: this.getParcoursTitre(parcoursKey),
          expanded: true,
          children: Object.entries(classes).map(([classeKey, classeGroup]: [string, any]) => ({
            type: 'etudiant' as const,
            label: this.getClasseLibelle(classeKey),
            id: classeKey,
            expanded: true,
            items: classeGroup.items.map((c: any) => this.cursusToItem(c))
          }))
        }))
      }))
    }))
  }

  private cursusToItem(c: CursusApprenant): any {
    const dossier = (c.utilisateur as any)?.dossiersEtudiants?.[0]
    return {
      id: c.id,
      matricule: dossier?.matricule || '-',
      nom: c.utilisateur ? `${c.utilisateur.nom} ${c.utilisateur.prenoms}` : '-',
      classe: c.classe?.libelle || '-',
      statut: dossier?.statut || '-',
      dateInscription: c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '-',
      photo: this.getPhotoUrl(c),
    }
  }

  getAnneeLibelle(id: string): string {
    if (id === 'toutes-annees') return 'Toutes les années'
    return this.annees.find(a => String(a.id) === String(id))?.libelle || id
  }

  getNiveauLibelle(id: string): string {
    if (id === 'tous-niveaux') return 'Tous les niveaux'
    return this.niveaux.find(n => String(n.id) === String(id))?.libelle || id
  }

  getParcoursTitre(id: string): string {
    if (id === 'tous-parcours') return 'Tous les parcours'
    return this.parcoursList.find(p => String(p.id) === String(id))?.titre || id
  }

  getClasseLibelle(id: string): string {
    if (id === 'toutes-classes') return 'Toutes les classes'
    return this.classes.find(c => String(c.id) === String(id))?.libelle || id
  }

  getPhotoUrl(c: CursusApprenant): string {
    const photo = (c.utilisateur as any)?.apprenant?.photo
    if (photo) {
      return this.PHOTOS_PATH + photo
    }
    return 'assets/images/blank-profile-picture.png'
  }

  // ========================================================================
  //  IMPORT / EXPORT EXCEL
  // ========================================================================

  openImportDialog(): void {
    this.importDialog.open();
  }

  onDownloadTemplate(): void {
    this.excelService.downloadApprenantTemplate().subscribe({
      next: (blob) => ExcelService.downloadBlob(blob, 'template-apprenants.xlsx'),
      error: (err) => console.error('Erreur téléchargement template', err),
    });
  }

  onImportApprenants(file: File) {
    return this.excelService.importApprenants(file);
  }

  onExportApprenants(): void {
    this.excelService.exportApprenants().subscribe({
      next: (blob) => ExcelService.downloadBlob(blob, 'apprenants.xlsx'),
      error: (err) => console.error('Erreur export apprenants', err),
    });
  }

  onImportDone(): void {
    this.refreshData();
  }

  private refreshData(): void {
    this.ngOnInit();
  }
}
