import { Component, OnInit } from '@angular/core';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-page',
  templateUrl: './ged-page.component.html',
  styleUrls: ['./ged-page.component.scss']
})
export class GedPageComponent implements OnInit {
  selectedFile?: File;
  selectedFileName: string = 'Aucun fichier sélectionné';
  selectedFileType: string = 'Aucun';
  searchQuery: string = '';
  metadata = {
    titre: '',
    reference: '',
    eleve: '',
    parcours: '',
    date: '',
    categorie: '',
    tags: ''
  };
  nommageType: string = 'GED';
  nommageDate: string = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  exampleNomenclature: string = 'GED-20260702-FACTURE-ETUD001-V1';

  documents: GedDocument[] = [];
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.gedService.getAll().subscribe({
      next: (res) => {
        this.documents = res.map(doc => ({
          ...doc,
          date: new Date(doc.createdAt || '').toLocaleDateString('fr-FR'),
          type: doc.type || 'PDF',
          statut: doc.statut || 'Disponible'
        } as GedDocument));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Impossible de charger les documents';
      }
    });
  }

  onFileChanged(file: File | null): void {
    if (!file) {
      this.selectedFile = undefined;
      this.selectedFileName = 'Aucun fichier sélectionné';
      this.selectedFileType = 'Aucun';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.selectedFileType = file.type.includes('tiff') ? 'TIFF' : file.type.includes('pdf') ? 'PDF' : file.type;
  }

  get filteredDocuments(): GedDocument[] {
    if (!this.searchQuery) {
      return this.documents;
    }

    const query = this.searchQuery.toLowerCase();
    return this.documents.filter(doc =>
      (doc.titre || '').toLowerCase().includes(query)
      || (doc.nommage || '').toLowerCase().includes(query)
      || (doc.type || '').toLowerCase().includes(query)
      || (doc.date || '').toLowerCase().includes(query)
      || (doc.statut || '').toLowerCase().includes(query)
    );
  }

  generateNomenclature(): void {
    const meta = this.metadata;
    const parts = [
      this.nommageType,
      this.nommageDate,
      meta.categorie || 'DOCUMENT',
      meta.reference || 'REF000',
      meta.parcours || 'PARCOURS',
      'V1'
    ];
    this.exampleNomenclature = parts.map(p => p.toUpperCase().replace(/\s+/g, '_')).join('-');
  }

  addDocument(): void {
    if (!this.selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    formData.append('titre', this.metadata.titre || this.selectedFile.name);
    formData.append('reference', this.metadata.reference || '');
    formData.append('eleve', this.metadata.eleve || '');
    formData.append('parcours', this.metadata.parcours || '');
    formData.append('categorie', this.metadata.categorie || '');
    formData.append('tags', this.metadata.tags || '');
    formData.append('nommage', this.exampleNomenclature);
    formData.append('type', this.selectedFileType);
    formData.append('statut', 'Disponible');

    this.gedService.upload(formData).subscribe({
      next: () => {
        this.success = 'Document ajouté avec succès';
        this.error = '';
        this.selectedFile = undefined;
        this.selectedFileName = 'Aucun fichier sélectionné';
        this.selectedFileType = 'Aucun';
        this.loadDocuments();
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'upload du document';
        setTimeout(() => this.error = '', 4000);
      }
    });
  }
}
