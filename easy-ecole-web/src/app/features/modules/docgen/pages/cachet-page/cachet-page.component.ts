import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DocGenCachetService } from 'src/app/data/modules/docgen/services/docgen-cachet.service';
import { DocGenCachet } from 'src/app/data/modules/docgen/models/DocGenCachet.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cachet-page',
  templateUrl: './cachet-page.component.html',
  styleUrls: ['./cachet-page.component.scss']
})
export class CachetPageComponent extends BaseComponentClass implements OnInit {
  cachets: DocGenCachet[] = [];
  loading = false;
  selectedFile: File | null = null;
  editingId: string | null = null;
  showForm = false;
  formData: Partial<DocGenCachet> = {};
  previewUrl: string = '';

  constructor(private cachetService: DocGenCachetService) { super(); }

  ngOnInit(): void { this.getCachets(); }

  getCachets(): void {
    this.loading = true;
    this.cachetService.getAll().subscribe({
      next: (res) => { this.cachets = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files?.[0] || null;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl = e.target?.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  ouvrirFormulaire(cachet?: DocGenCachet): void {
    this.editingId = cachet?.id || null;
    this.formData = cachet ? { ...cachet } : { libelle: '', positionX: 450, positionY: 700, width: 120, height: 120, isActive: false };
    this.showForm = true;
  }

  sauvegarder(): void {
    if (!this.formData.libelle) return;
    if (this.selectedFile) {
      const fd = new FormData();
      fd.append('cachet', this.selectedFile);
      fd.append('libelle', this.formData.libelle || '');
      this.cachetService.upload(fd).subscribe({
        next: () => { this.showForm = false; this.selectedFile = null; this.getCachets(); },
        error: (err) => alert('Erreur: ' + err.message)
      });
    } else if (this.editingId) {
      this.cachetService.update(this.editingId, this.formData).subscribe({
        next: () => { this.showForm = false; this.getCachets(); }
      });
    }
  }

  setActive(id: string): void {
    this.cachetService.setActive(id).subscribe({ next: () => this.getCachets() });
  }

  supprimer(id?: string): void {
    if (!id || !confirm('Supprimer ce cachet ?')) return;
    this.cachetService.delete(id).subscribe({ next: () => this.getCachets() });
  }

  getImageUrl(cachet: DocGenCachet): string {
    return cachet.imagePath ? `${environment.API_BASE_URL}${cachet.imagePath.replace(/^\/+/, '')}` : '';
  }
}
