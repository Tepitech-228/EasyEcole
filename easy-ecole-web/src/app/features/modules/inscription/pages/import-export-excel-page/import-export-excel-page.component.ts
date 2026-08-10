import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ExcelService, ExcelImportResult } from 'src/app/data/modules/inscription/services/excel.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { SalleDeClasseService } from 'src/app/data/modules/inscription/services/salle-de-classe.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';

export type ExportType = 'etudiants' | 'enseignants' | 'utilisateurs';
export type ImportType = 'etudiants' | 'enseignants' | 'utilisateurs';

@Component({
  selector: 'app-import-export-excel-page',
  templateUrl: './import-export-excel-page.component.html',
  styleUrls: ['./import-export-excel-page.component.scss']
})
export class ImportExportExcelPageComponent extends BaseComponentClass implements OnInit {
  activeTab: 'export' | 'import' = 'export';

  exportType: ExportType = 'etudiants';
  importType: ImportType = 'utilisateurs';
  selectedImportRole: string = RolesUtilisateur.APPRENANT;

  exportFilters = {
    parcoursId: null as number | null,
    filiereId: null as number | null,
    promotionId: null as number | null,
    salleId: null as number | null,
    niveauId: null as number | null,
    classeId: null as number | null,
    anneeAcademiqueId: null as number | null,
    coursId: null as number | null
  };

  parcoursList: any[] = [];
  niveauxList: any[] = [];
  classesList: any[] = [];
  sallesList: any[] = [];
  anneesList: any[] = [];

  selectedFile: File | null = null;
  importing = false;
  importResult: ExcelImportResult | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly exportTypes = [
    { value: 'etudiants' as ExportType, label: 'Étudiants' },
    { value: 'enseignants' as ExportType, label: 'Enseignants' },
    { value: 'utilisateurs' as ExportType, label: 'Utilisateurs par rôle' }
  ];

  readonly importTypes = [
    { value: 'etudiants' as ImportType, label: 'Étudiants' },
    { value: 'enseignants' as ImportType, label: 'Enseignants' },
    { value: 'utilisateurs' as ImportType, label: 'Utilisateurs par rôle' }
  ];

  readonly rolesList = [
    { value: RolesUtilisateur.APPRENANT, label: 'Étudiant' },
    { value: RolesUtilisateur.ENSEIGNANT, label: 'Enseignant' },
    { value: RolesUtilisateur.INSTITUTION, label: 'Institution' },
    { value: RolesUtilisateur.CAISSIER_BANQUE, label: 'Caissier/Banque' },
    { value: RolesUtilisateur.RESSOURCES_HUMAINES, label: 'Ressources humaines' },
    { value: RolesUtilisateur.CABINET_COMPTABLE, label: 'Cabinet comptable' },
    { value: RolesUtilisateur.COMITE_ORIENTATION, label: 'Comité d\'orientation' },
    { value: RolesUtilisateur.ADMIN, label: 'Administrateur' },
    { value: RolesUtilisateur.PARENT, label: 'Parent' }
  ];

  constructor(
    private excelService: ExcelService,
    private parcoursService: ParcoursService,
    private niveauService: NiveauEtudeService,
    private classeService: ClasseService,
    private salleService: SalleDeClasseService,
    private anneeService: AnneeAcademiqueService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadReferenceData();
  }

  loadReferenceData(): void {
    this.parcoursService.getAll().subscribe({
      next: (res: any) => { this.parcoursList = res.data || res; },
      error: () => {}
    });
    this.niveauService.getAll().subscribe({
      next: (res: any) => { this.niveauxList = res.data || res; },
      error: () => {}
    });
    this.classeService.getAll().subscribe({
      next: (res: any) => { this.classesList = res.data || res; },
      error: () => {}
    });
    this.salleService.getAll().subscribe({
      next: (res: any) => { this.sallesList = res.data || res; },
      error: () => {}
    });
    this.anneeService.getAll().subscribe({
      next: (res: any) => { this.anneesList = res.data || res; },
      error: () => {}
    });
  }

  exporter(): void {
    this.errorMessage = null;
    this.successMessage = null;

    let download$: any;

    if (this.exportType === 'etudiants') {
      download$ = this.excelService.exportApprenantsFiltres(this.exportFilters);
    } else if (this.exportType === 'enseignants') {
      download$ = this.excelService.exportEnseignantsFiltres({
        filiereId: this.exportFilters.filiereId,
        coursId: this.exportFilters.coursId,
        anneeAcademiqueId: this.exportFilters.anneeAcademiqueId
      });
    } else {
      download$ = this.excelService.exportUtilisateursParRole(this.selectedImportRole);
    }

    download$.subscribe({
      next: (blob: Blob) => {
        const ext = this.exportType === 'etudiants' ? 'etudiants' :
                    this.exportType === 'enseignants' ? 'enseignants' :
                    `utilisateurs-${this.selectedImportRole}`;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        ExcelService.downloadBlob(blob, `export-${ext}-${timestamp}.xlsx`);
        this.successMessage = 'Export généré et téléchargé avec succès.';
      },
      error: () => {
        this.errorMessage = 'Erreur lors du téléchargement du fichier Excel.';
      }
    });
  }

  telechargerTemplate(): void {
    this.errorMessage = null;
    this.successMessage = null;

    let download$: any;
    let filename: string;

    if (this.importType === 'etudiants') {
      download$ = this.excelService.downloadApprenantTemplate();
      filename = 'template-apprenants.xlsx';
    } else if (this.importType === 'enseignants') {
      download$ = this.excelService.downloadEnseignantTemplate();
      filename = 'template-enseignants.xlsx';
    } else {
      download$ = this.excelService.downloadUtilisateurTemplate(this.selectedImportRole);
      filename = `template-utilisateurs-${this.selectedImportRole}.xlsx`;
    }

    download$.subscribe({
      next: (blob: Blob) => {
        ExcelService.downloadBlob(blob, filename);
        this.successMessage = `Template téléchargé : ${filename}`;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du téléchargement du template.';
      }
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    this.importResult = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
      this.importResult = null;
      this.errorMessage = null;
      this.successMessage = null;
    }
  }

  openFilePicker(): void {
    document.getElementById('fileInput')?.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  importer(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Veuillez sélectionner un fichier.';
      return;
    }

    this.importing = true;
    this.importResult = null;
    this.errorMessage = null;
    this.successMessage = null;

    let import$: any;

    if (this.importType === 'etudiants') {
      import$ = this.excelService.importApprenants(this.selectedFile);
    } else if (this.importType === 'enseignants') {
      import$ = this.excelService.importEnseignants(this.selectedFile);
    } else {
      import$ = this.excelService.importUtilisateursParRole(this.selectedFile, this.selectedImportRole);
    }

    import$.subscribe({
      next: (result: ExcelImportResult) => {
        this.importResult = result;
        this.importing = false;
        if (result.success) {
          this.successMessage = `Import terminé : ${result.importedCount} réussi(s), ${result.errorCount} erreur(s).`;
        }
      },
      error: (err) => {
        this.importResult = null;
        this.importing = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de l\'import.';
      }
    });
  }

  resetImport(): void {
    this.selectedFile = null;
    this.importResult = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  importTypeChanged(): void {
  }

  getImportFileTypeLabel(): string {
    switch (this.importType) {
      case 'etudiants': return 'Étudiants';
      case 'enseignants': return 'Enseignants';
      default: return 'Utilisateurs (' + (this.rolesList.find(r => r.value === this.selectedImportRole)?.label || this.selectedImportRole) + ')';
    }
  }

  trackByFn(index: number, item: any): number { return index; }
}
