import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { QualiteRevueDirectionService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';

@Component({
  selector: 'app-revues-direction-page',
  templateUrl: './revues-direction-page.component.html',
  styleUrls: ['./revues-direction-page.component.scss']
})
export class RevuesDirectionPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  selected: any = null;

  constructor(private service: QualiteRevueDirectionService) { super(); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  ouvrirFormulaire(item?: any): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { titre: '', dateTenue: '', participants: '', ordreJour: '', statut: 'planifiee' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; this.selected = null; }

  sauvegarder(): void {
    if (!this.formData.titre || !this.formData.dateTenue) return;
    const obs = this.editingId ? this.service.update(this.editingId, this.formData) : this.service.create(this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id?: string): void {
    if (!id || !confirm('Supprimer cette revue ?')) return;
    this.service.delete(id).subscribe({ next: () => this.load() });
  }

  voirDetails(item: any): void { this.selected = item; }
}
