import { Component, OnInit } from '@angular/core';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-archives',
  templateUrl: './ged-archives.component.html',
  styleUrls: ['./ged-archives.component.scss']
})
export class GedArchivesComponent implements OnInit {
  documents: GedDocument[] = [];
  loading = false;

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.gedService.getAll({ statut: 'archive' }).subscribe({
      next: (res) => { this.documents = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get tailleTotale(): string {
    const totalKo = this.documents.reduce((s, d) => {
      const v = parseFloat((d.taille || '0').replace(/,/, '.').replace(/[^0-9.]/g, ''));
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    if (totalKo > 1048576) return (totalKo / 1048576).toFixed(1) + ' Go';
    if (totalKo > 1024) return (totalKo / 1024).toFixed(1) + ' Mo';
    return totalKo.toFixed(0) + ' Ko';
  }

  download(doc: GedDocument) {
    window.open(this.gedService.getDownloadUrl(doc.id), '_blank');
  }

  restaurer(doc: GedDocument) {
    const fd = new FormData();
    fd.append('statut', 'Disponible');
    fd.append('isArchived', 'false');
    this.gedService.update(doc.id, fd).subscribe({ next: () => this.load() });
  }
}
