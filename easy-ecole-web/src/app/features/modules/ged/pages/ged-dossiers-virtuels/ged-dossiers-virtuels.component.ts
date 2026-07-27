import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

type DossierType = 'etudiant' | 'employe';

@Component({
  selector: 'app-ged-dossiers-virtuels',
  templateUrl: './ged-dossiers-virtuels.component.html',
  styleUrls: ['./ged-dossiers-virtuels.component.scss']
})
export class GedDossiersVirtuelsComponent implements OnInit {
  type: DossierType = 'etudiant';
  entityId = '';
  documents: GedDocument[] = [];
  loading = false;
  searched = false;

  constructor(private gedService: GedService, private router: Router) {}

  ngOnInit(): void {}

  search() {
    if (!this.entityId.trim()) return;
    this.searched = true;
    this.loading = true;
    this.gedService.getAllPaginated({
      page: 1,
      pageSize: 50,
      [this.type === 'etudiant' ? 'parcoursId' : 'niveauEtudeId']: Number(this.entityId)
    }).subscribe({
      next: (res) => {
        this.documents = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get typeLabel(): string {
    return this.type === 'etudiant' ? 'Etudiant' : 'Employe';
  }

  get typePlaceholder(): string {
    return this.type === 'etudiant' ? 'ID etudiant / parcoursId' : 'ID employe / niveauEtudeId';
  }

  formatDate(date?: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR');
  }

  download(doc: GedDocument) {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }

  navigateToDocument(doc: GedDocument) {
    this.router.navigate(['/ged/document', doc.id]);
  }
}
